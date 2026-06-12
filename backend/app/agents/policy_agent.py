"""Policy RAG Agent - answers policy questions using document retrieval."""
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, AIMessage

from app.agents.state import AgentState
from app.agents.prompt_loader import load_prompt
from app.auth.rbac import UserRole
from app.rag.retriever import ScopedRetriever
from app.config import get_settings

POLICY_AGENT_PROMPT = load_prompt("policy_agent")


def policy_agent_node(state: AgentState) -> dict:
    """Process policy queries with RAG retrieval."""
    settings = get_settings()
    retriever = ScopedRetriever(top_k=6)

    # Get the latest user message
    user_query = state.messages[-1].content if state.messages else ""

    # Determine relevant categories based on intent
    category_map = {
        "leave": ["leave_attendance"],
        "compensation": ["compensation"],
        "salary": ["compensation"],
        "reimbursement": ["reimbursement"],
        "benefits": ["benefits"],
        "healthcare": ["benefits"],
        "insurance": ["benefits"],
        "onboarding": ["onboarding"],
        "compliance": ["compliance"],
    }

    categories = None
    for keyword, cats in category_map.items():
        if keyword in user_query.lower():
            categories = cats
            break

    # Retrieve relevant documents
    docs = retriever.retrieve(
        query=user_query,
        role=UserRole(state.role),
        profile=None,  # Context already in state
        category_filter=categories,
    )

    context = "\n\n---\n\n".join([
        f"[Source: {doc.metadata.get('source_file', 'unknown')} | Category: {doc.metadata.get('category', 'unknown')}]\n{doc.page_content}"
        for doc in docs
    ])

    # Build prompt
    system_prompt = POLICY_AGENT_PROMPT.format(
        employee_name=state.employee_name,
        grade=state.grade,
        location=state.location,
        employment_type=state.employment_type,
        department=state.department,
        work_mode=state.work_mode,
        joining_date=state.joining_date,
        context=context,
    )

    llm = ChatAnthropic(
        model=settings.anthropic_model,
        api_key=settings.anthropic_api_key,
        temperature=0.1,
        max_tokens=2000,
    )

    messages = [SystemMessage(content=system_prompt)] + state.messages
    response = llm.invoke(messages)

    # Build source references with metadata
    source_refs = []
    seen_sources = set()
    for doc in docs:
        source_file = doc.metadata.get("source_file", "")
        if source_file and source_file not in seen_sources:
            seen_sources.add(source_file)
            source_refs.append(f"{source_file}|{doc.metadata.get('category', 'general')}")

    return {
        "messages": [AIMessage(content=response.content)],
        "retrieved_documents": source_refs,
        "final_response": response.content,
    }
