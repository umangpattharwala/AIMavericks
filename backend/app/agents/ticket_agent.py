"""Ticket Agent - handles support ticket creation for benefits issues."""
import json
from datetime import datetime, timezone

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, AIMessage

from app.agents.state import AgentState, TicketRequest
from app.agents.prompt_loader import load_prompt
from app.config import get_settings

TICKET_AGENT_PROMPT = load_prompt("ticket_agent")

# In-memory ticket store (replace with DB in production)
_ticket_store: list[dict] = []


def ticket_agent_node(state: AgentState) -> dict:
    """Handle ticket creation workflow."""
    settings = get_settings()

    user_query = state.messages[-1].content if state.messages else ""

    system_prompt = TICKET_AGENT_PROMPT.format(
        employee_name=state.employee_name,
        employee_id=state.employee_id,
        department=state.department,
        grade=state.grade,
        location=state.location,
    )

    llm = ChatAnthropic(
        model=settings.anthropic_model,
        api_key=settings.anthropic_api_key,
        temperature=0.1,
        max_tokens=1500,
    )

    messages = [SystemMessage(content=system_prompt)] + state.messages
    response = llm.invoke(messages)

    # Check if the response contains a ticket creation
    ticket_status = ""
    if "Ticket Created" in response.content or "TKT-" in response.content:
        ticket_id = f"TKT-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        ticket = {
            "id": ticket_id,
            "employee_id": state.employee_id,
            "employee_name": state.employee_name,
            "query": user_query,
            "response": response.content,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "open",
        }
        _ticket_store.append(ticket)
        ticket_status = "created"

    return {
        "messages": [AIMessage(content=response.content)],
        "ticket_status": ticket_status,
        "final_response": response.content,
    }


def get_tickets_for_employee(employee_id: str) -> list[dict]:
    """Retrieve all tickets for an employee."""
    return [t for t in _ticket_store if t["employee_id"] == employee_id]


def get_all_tickets() -> list[dict]:
    """Retrieve all tickets (HR access)."""
    return _ticket_store
