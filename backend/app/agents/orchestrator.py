"""Orchestrator agent - routes queries to specialized agents."""
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate

from app.agents.state import AgentState
from app.agents.prompt_loader import load_prompt
from app.config import get_settings

ORCHESTRATOR_SYSTEM_PROMPT = load_prompt("orchestrator")


def create_orchestrator():
    settings = get_settings()
    return ChatAnthropic(
        model=settings.anthropic_model,
        api_key=settings.anthropic_api_key,
        temperature=0,
        max_tokens=500,
    )


def orchestrator_node(state: AgentState) -> dict:
    """Classify intent and determine routing."""
    import json

    llm = create_orchestrator()

    system_prompt = ORCHESTRATOR_SYSTEM_PROMPT.format(
        employee_name=state.employee_name,
        employee_id=state.employee_id,
        role=state.role.value,
        department=state.department,
        grade=state.grade,
        location=state.location,
        employment_type=state.employment_type,
        work_mode=state.work_mode,
    )

    messages = [SystemMessage(content=system_prompt)] + state.messages

    response = llm.invoke(messages)

    try:
        # Parse the routing decision
        result = json.loads(response.content)
        return {
            "intent": result.get("intent", ""),
            "target_agent": result.get("target_agent", "policy_agent"),
            "requires_escalation": result.get("requires_escalation", False),
            "needs_clarification": result.get("needs_clarification", False),
        }
    except (json.JSONDecodeError, KeyError):
        # Default to policy agent if parsing fails
        return {
            "intent": "general_query",
            "target_agent": "policy_agent",
            "requires_escalation": False,
        }


def route_to_agent(state: AgentState) -> str:
    """Conditional edge: route to the appropriate agent based on orchestrator decision."""
    if state.needs_clarification:
        return "clarify"

    # Access control enforcement
    if state.role == "employee" and state.target_agent in ("research_agent", "equity_agent"):
        return "access_denied"

    return state.target_agent
