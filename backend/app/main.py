"""FastAPI main application - API endpoints for the multi-agent system."""
import json
import uuid
import asyncio
import truststore
truststore.inject_into_ssl()
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional, AsyncGenerator

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.auth.rbac import (
    UserRole,
    UserSession,
    get_current_user,
    require_role,
    create_access_token,
)
from app.auth.employee_context import get_employee_directory
from app.agents.graph import get_graph
from app.agents.state import AgentState
from app.agents.golden_responses import match_golden_question
from app.db.session import init_db, get_db
from app.db.memory import ConversationMemory
from app.db.tickets import TicketRepository
from app.observability.tracing import init_langfuse, init_phoenix, trace_conversation


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown."""
    # Initialize database
    await init_db()
    # Initialize observability
    init_langfuse()
    init_phoenix()
    print("[Startup] Multi-agent system ready")
    yield
    print("[Shutdown] Cleaning up...")


app = FastAPI(
    title="NexaCore Total Rewards & Benefits AI",
    description="Multi-agent system for employee benefits queries and HR research",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request/Response Models ────────────────────────────────────────────────────


class LoginRequest(BaseModel):
    employee_id: str
    role: UserRole = UserRole.EMPLOYEE


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    employee_name: str
    role: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    stream: bool = False


class ChatResponse(BaseModel):
    response: str
    session_id: str
    agent_used: str
    intent: str
    sources: list[dict] = []


class TicketListResponse(BaseModel):
    tickets: list[dict]


class TicketCreateRequest(BaseModel):
    description: str
    category: str = ""
    priority: str = "medium"


class TicketUpdateRequest(BaseModel):
    status: str
    resolution: str = ""


# ─── Auth Endpoints ─────────────────────────────────────────────────────────────


@app.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login as an employee (demo - no password for hackathon)."""
    directory = get_employee_directory()
    profile = directory.get_employee_by_id(request.employee_id)

    if not profile:
        raise HTTPException(status_code=404, detail="Employee not found")

    token = create_access_token(request.employee_id, request.role)

    return LoginResponse(
        access_token=token,
        employee_name=profile.employee_name,
        role=request.role.value,
    )


@app.get("/api/auth/me")
async def get_me(user: UserSession = Depends(get_current_user)):
    """Get current user profile."""
    return {
        "employee_id": user.employee_id,
        "name": user.profile.employee_name,
        "role": user.role.value,
        "department": user.profile.department,
        "grade": user.profile.grade,
        "location": user.profile.location,
        "employment_type": user.profile.employment_type,
        "work_mode": user.profile.work_mode,
        "joining_date": user.profile.joining_date,
        "designation": user.profile.designation,
        "leave_balance": user.profile.leave_balance,
    }


# ─── Chat Endpoints ─────────────────────────────────────────────────────────────


async def _run_agent(
    message: str,
    session_id: str,
    user: UserSession,
    db: AsyncSession,
) -> dict:
    """Execute the agent graph with conversation memory."""
    memory = ConversationMemory(db)

    # Get or create session
    session_id = await memory.get_or_create_session(
        session_id, user.employee_id, user.role.value
    )

    # Load conversation history
    history = await memory.get_history(session_id, limit=10)

    # Save user message
    await memory.add_message(session_id, "user", message)

    # Build state with history + new message
    all_messages = history + [HumanMessage(content=message)]

    initial_state = AgentState(
        messages=all_messages,
        employee_id=user.employee_id,
        employee_name=user.profile.employee_name,
        role=user.role,
        department=user.profile.department,
        grade=user.profile.grade,
        location=user.profile.location,
        employment_type=user.profile.employment_type,
        work_mode=user.profile.work_mode,
        joining_date=user.profile.joining_date,
    )

    # Execute the graph with tracing
    with trace_conversation(session_id=session_id, user_id=user.employee_id) as callbacks:
        graph = get_graph()
        config = {"callbacks": callbacks} if callbacks else {}
        result = graph.invoke(initial_state, config=config)

    # Extract response
    final_response = result.get("final_response", "")
    if not final_response and result.get("messages"):
        last_msg = result["messages"][-1]
        final_response = last_msg.content if hasattr(last_msg, "content") else str(last_msg)

    agent_used = result.get("target_agent", "unknown")
    intent = result.get("intent", "")

    # Save assistant message
    await memory.add_message(session_id, "assistant", final_response, agent_used, intent)

    # Parse source references (format: "filename|category")
    raw_sources = result.get("retrieved_documents", [])
    sources = []
    for src in raw_sources[:5]:
        if "|" in src:
            filename, category = src.split("|", 1)
            sources.append({
                "filename": filename,
                "category": category,
                "download_url": f"/api/documents/download/{filename}",
            })
        elif src:
            sources.append({
                "filename": src,
                "category": "general",
                "download_url": f"/api/documents/download/{src}",
            })

    return {
        "response": final_response,
        "session_id": session_id,
        "agent_used": agent_used,
        "intent": intent,
        "sources": sources,
    }


def _generate_suggestions(agent_used: str, intent: str, user_message: str) -> list[str]:
    """Generate contextual follow-up suggestions based on the conversation."""
    msg_lower = user_message.lower()

    # Agent-specific suggestions
    suggestions_map = {
        "policy_agent": {
            "leave": ["How many leave days do I have remaining?", "What's the process to apply for leave?", "Explain the work-from-home policy"],
            "benefit": ["Compare the healthcare plan tiers", "What dental coverage is included?", "How do I enroll in benefits?"],
            "health": ["What's covered under the premium plan?", "How do I add dependents?", "What's the annual deductible?"],
            "compensation": ["How does the bonus structure work?", "When is the next salary review?", "Explain stock option vesting"],
            "default": ["What other policies should I know about?", "Can you explain the reimbursement process?", "What benefits am I eligible for?"],
        },
        "rewards_agent": {
            "default": ["Show me my full compensation breakdown", "How does vesting work for my stock options?", "What's my next review cycle?"],
        },
        "ticket_agent": {
            "default": ["Check the status of my tickets", "I have another issue to report", "Who can I escalate this to?"],
        },
        "research_agent": {
            "default": ["Compare with industry benchmarks", "What are the compliance implications?", "Summarize the key findings"],
        },
    }

    agent_map = suggestions_map.get(agent_used, suggestions_map.get("policy_agent", {}))

    # Find matching category
    for keyword, sug_list in agent_map.items():
        if keyword != "default" and keyword in msg_lower:
            return sug_list[:3]

    return agent_map.get("default", [])[:3]


@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Main chat endpoint - routes to appropriate agent with conversation memory."""
    session_id = request.session_id or str(uuid.uuid4())

    result = await _run_agent(request.message, session_id, user, db)

    return ChatResponse(**result)


@app.post("/api/chat/stream")
async def chat_stream(
    request: ChatRequest,
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """SSE streaming chat endpoint - streams agent response tokens."""
    session_id = request.session_id or str(uuid.uuid4())

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # Send session_id immediately
            yield f"data: {json.dumps({'type': 'session', 'session_id': session_id})}\n\n"

            # Check for golden demo questions first
            golden = match_golden_question(request.message, user.role.value)
            if golden:
                # Use hardcoded demo response
                result = {
                    "response": golden["response"],
                    "agent_used": golden["agent_used"],
                    "intent": golden["intent"],
                    "sources": [],
                }
                suggestions = golden.get("suggestions", [])
            else:
                # Run agent (non-streaming execution, then stream the result)
                result = await _run_agent(request.message, session_id, user, db)
                suggestions = _generate_suggestions(result.get('agent_used', ''), result.get('intent', ''), request.message)

            # Send metadata
            yield f"data: {json.dumps({'type': 'metadata', 'agent_used': result['agent_used'], 'intent': result['intent']})}\n\n"

            # Stream response in chunks for smooth UX
            response_text = result["response"]
            chunk_size = 20  # characters per chunk
            for i in range(0, len(response_text), chunk_size):
                chunk = response_text[i:i + chunk_size]
                yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
                await asyncio.sleep(0.02)  # Small delay for streaming effect

            # Send sources
            if result.get("sources"):
                yield f"data: {json.dumps({'type': 'sources', 'sources': result['sources']})}\n\n"

            # Send suggestions
            if suggestions:
                yield f"data: {json.dumps({'type': 'suggestions', 'suggestions': suggestions})}\n\n"

            # Done
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ─── Document Endpoints ──────────────────────────────────────────────────────────


@app.get("/api/documents/download/{filename}")
async def download_document(
    filename: str,
    user: UserSession = Depends(get_current_user),
):
    """Download a source document. Access controlled by role."""
    settings = get_settings()
    docs_path = Path(settings.rag_documents_dir).resolve()
    file_path = (docs_path / filename).resolve()

    # Security: prevent path traversal
    if not str(file_path).startswith(str(docs_path)):
        raise HTTPException(status_code=403, detail="Access denied")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream",
    )


@app.get("/api/documents")
async def list_documents(
    user: UserSession = Depends(get_current_user),
):
    """List available source documents."""
    settings = get_settings()
    docs_path = Path(settings.rag_documents_dir).resolve()

    if not docs_path.exists():
        return {"documents": []}

    documents = []
    for f in sorted(docs_path.iterdir()):
        if f.is_file() and not f.name.startswith("."):
            ext = f.suffix.lower()
            if ext in (".docx", ".xlsx", ".csv", ".pdf"):
                documents.append({
                    "filename": f.name,
                    "type": ext.lstrip("."),
                    "size": f.stat().st_size,
                    "download_url": f"/api/documents/download/{f.name}",
                })

    return {"documents": documents}


# ─── Conversation History Endpoints ─────────────────────────────────────────────


@app.get("/api/conversations")
async def list_conversations(
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all conversation sessions for current user."""
    memory = ConversationMemory(db)
    sessions = await memory.get_sessions_for_employee(user.employee_id)
    return {"conversations": sessions}


@app.get("/api/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get messages for a specific conversation."""
    memory = ConversationMemory(db)
    # Verify ownership
    sessions = await memory.get_sessions_for_employee(user.employee_id)
    if not any(s["id"] == conversation_id for s in sessions):
        raise HTTPException(status_code=403, detail="Access denied to this conversation")

    from sqlalchemy import select
    from app.db.models import Message
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.id)
    )
    messages = result.scalars().all()
    return {
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "agent_used": m.agent_used,
                "created_at": m.created_at.isoformat() if m.created_at else "",
            }
            for m in messages
        ]
    }


# ─── Ticket Endpoints (Database-backed) ─────────────────────────────────────────


@app.get("/api/tickets/my", response_model=TicketListResponse)
async def my_tickets(
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current employee's tickets."""
    repo = TicketRepository(db)
    tickets = await repo.get_employee_tickets(user.employee_id)
    return TicketListResponse(tickets=tickets)


@app.post("/api/tickets")
async def create_ticket(
    request: TicketCreateRequest,
    user: UserSession = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new support ticket."""
    import uuid
    repo = TicketRepository(db)
    ticket_id = f"TKT-{int(uuid.uuid4().int % 90000) + 10000}"
    
    # Infer category from description if not provided
    category = request.category
    if not category:
        desc_lower = request.description.lower()
        if any(w in desc_lower for w in ["leave", "pto", "vacation", "holiday", "comp-off"]):
            category = "Leave"
        elif any(w in desc_lower for w in ["reimburse", "expense", "claim", "receipt"]):
            category = "Reimbursement"
        elif any(w in desc_lower for w in ["salary", "payroll", "payslip", "tax", "ctc"]):
            category = "Payroll"
        elif any(w in desc_lower for w in ["insurance", "health", "dental", "vision", "benefit"]):
            category = "Benefits"
        elif any(w in desc_lower for w in ["compliance", "policy", "regulation", "audit"]):
            category = "Compliance"
        elif any(w in desc_lower for w in ["onboard", "joining", "induction", "new hire"]):
            category = "Onboarding"
        else:
            category = "Benefits"

    # Infer priority
    priority = request.priority
    if not priority or priority == "medium":
        desc_lower = request.description.lower()
        if any(w in desc_lower for w in ["urgent", "critical", "immediately", "asap", "emergency"]):
            priority = "high"

    title = request.description[:80] + ("..." if len(request.description) > 80 else "")
    
    ticket = await repo.create_ticket(
        ticket_id=ticket_id,
        employee_id=user.employee_id,
        employee_name=user.name,
        title=title,
        description=request.description,
        category=category,
        priority=priority,
    )
    return {
        "status": "created",
        "ticket_id": ticket_id,
        "category": category,
        "priority": priority,
    }


@app.get("/api/tickets/all", response_model=TicketListResponse)
async def all_tickets(
    user: UserSession = Depends(require_role([UserRole.HR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Get all tickets (HR only)."""
    repo = TicketRepository(db)
    tickets = await repo.get_all_tickets()
    return TicketListResponse(tickets=tickets)


@app.patch("/api/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    request: TicketUpdateRequest,
    user: UserSession = Depends(require_role([UserRole.HR, UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    """Update ticket status (HR only)."""
    repo = TicketRepository(db)
    ticket = await repo.update_ticket_status(ticket_id, request.status, request.resolution)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"status": "updated", "ticket_id": ticket_id}


# ─── Utility Endpoints ──────────────────────────────────────────────────────────


@app.get("/api/employees/directory")
async def employee_directory(
    user: UserSession = Depends(require_role([UserRole.HR, UserRole.ADMIN])),
):
    """Get employee directory (HR only)."""
    directory = get_employee_directory()
    return {
        "departments": directory.get_all_departments(),
        "locations": directory.get_all_locations(),
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy", "service": "nexacore-rewards-ai", "version": "2.0.0"}
