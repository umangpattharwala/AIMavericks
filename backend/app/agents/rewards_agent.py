"""Personal Rewards Agent - personalized compensation and benefits information."""
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, AIMessage

from app.agents.state import AgentState
from app.agents.prompt_loader import load_prompt
from app.auth.rbac import UserRole
from app.rag.retriever import ScopedRetriever
from app.config import get_settings

REWARDS_AGENT_PROMPT = load_prompt("rewards_agent")


def rewards_agent_node(state: AgentState) -> dict:
    """Provide personalized rewards and benefits information."""
    settings = get_settings()
    retriever = ScopedRetriever(top_k=8)

    user_query = state.messages[-1].content if state.messages else ""

    # Retrieve from benefits and compensation categories
    docs = retriever.retrieve(
        query=user_query,
        role=UserRole(state.role),
        category_filter=["benefits", "compensation", "lifecycle"],
    )

    context = "\n\n---\n\n".join([
        f"[Source: {doc.metadata.get('source_file', 'unknown')}]\n{doc.page_content}"
        for doc in docs
    ])

    system_prompt = REWARDS_AGENT_PROMPT.format(
        employee_name=state.employee_name,
        employee_id=state.employee_id,
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
        temperature=0.2,
        max_tokens=2500,
    )

    messages = [SystemMessage(content=system_prompt)] + state.messages
    response = llm.invoke(messages)

    return {
        "messages": [AIMessage(content=response.content)],
        "retrieved_documents": [doc.page_content[:200] for doc in docs],
        "final_response": response.content,
    }
