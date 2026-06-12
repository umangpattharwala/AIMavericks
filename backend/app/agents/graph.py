"""LangGraph workflow - the multi-agent orchestration graph."""
from langgraph.graph import StateGraph, END
from langchain_core.messages import AIMessage

from app.agents.state import AgentState
from app.agents.orchestrator import orchestrator_node, route_to_agent
from app.agents.policy_agent import policy_agent_node
from app.agents.rewards_agent import rewards_agent_node
from app.agents.ticket_agent import ticket_agent_node
from app.agents.research_agent import research_agent_node
from app.agents.life_event_agent import life_event_agent_node
from app.agents.equity_agent import equity_agent_node


def clarify_node(state: AgentState) -> dict:
    """Ask clarifying question when intent is ambiguous."""
    return {
        "messages": [AIMessage(content=(
            "I'd like to help you better. Could you clarify what you need?\n\n"
            "I can help with:\n"
            "- **Policy questions** (leave, benefits, compensation rules)\n"
            "- **Your personal rewards** (your specific benefits, stock options, healthcare)\n"
            "- **Life event simulation** (what happens to your benefits if you relocate, have a baby, switch roles, etc.)\n"
            "- **Raise a ticket** (report issues, request changes)\n"
            + ("\n- **Research** (policy benchmarking, industry analysis)\n" if state.role == "hr" else "")
            + ("\n- **Equity analysis** (pay gap detection, compensation anomalies)\n" if state.role == "hr" else "")
            + "\nWhat would you like help with?"
        ))],
        "needs_clarification": False,
    }


def access_denied_node(state: AgentState) -> dict:
    """Handle unauthorized access attempts."""
    return {
        "messages": [AIMessage(content=(
            "I'm sorry, but research and benchmarking capabilities are only available "
            "to HR team members. As an employee, I can help you with:\n\n"
            "- Understanding your benefits and rewards\n"
            "- Clarifying company policies\n"
            "- Raising support tickets\n\n"
            "How can I assist you today?"
        ))],
        "final_response": "Access denied - research agent requires HR role",
    }


def build_graph() -> StateGraph:
    """Build and compile the multi-agent LangGraph workflow.

    Architecture:
    ┌─────────────────────────────────────────────────────┐
    │                    START                              │
    └───────────────────────┬─────────────────────────────┘
                            │
                            ▼
    ┌─────────────────────────────────────────────────────┐
    │               ORCHESTRATOR                           │
    │  (Intent classification + Routing)                   │
    └──┬────────┬────────┬────────┬────────┬─────────────┘
       │        │        │        │        │
       ▼        ▼        ▼        ▼        ▼
    ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
    │Policy│ │Reward│ │Ticket│ │Resrch│ │Clrfy │
    │Agent │ │Agent │ │Agent │ │Agent │ │Node  │
    └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
       │        │        │        │        │
       ▼        ▼        ▼        ▼        ▼
    ┌─────────────────────────────────────────────────────┐
    │                      END                             │
    └─────────────────────────────────────────────────────┘
    """

    # Define the graph
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("policy_agent", policy_agent_node)
    workflow.add_node("rewards_agent", rewards_agent_node)
    workflow.add_node("ticket_agent", ticket_agent_node)
    workflow.add_node("research_agent", research_agent_node)
    workflow.add_node("life_event_agent", life_event_agent_node)
    workflow.add_node("equity_agent", equity_agent_node)
    workflow.add_node("clarify", clarify_node)
    workflow.add_node("access_denied", access_denied_node)

    # Set entry point
    workflow.set_entry_point("orchestrator")

    # Conditional routing from orchestrator
    workflow.add_conditional_edges(
        "orchestrator",
        route_to_agent,
        {
            "policy_agent": "policy_agent",
            "rewards_agent": "rewards_agent",
            "ticket_agent": "ticket_agent",
            "research_agent": "research_agent",
            "life_event_agent": "life_event_agent",
            "equity_agent": "equity_agent",
            "clarify": "clarify",
            "access_denied": "access_denied",
        },
    )

    # All agents terminate after responding
    workflow.add_edge("policy_agent", END)
    workflow.add_edge("rewards_agent", END)
    workflow.add_edge("ticket_agent", END)
    workflow.add_edge("research_agent", END)
    workflow.add_edge("life_event_agent", END)
    workflow.add_edge("equity_agent", END)
    workflow.add_edge("clarify", END)
    workflow.add_edge("access_denied", END)

    return workflow.compile()


# Singleton compiled graph
_graph = None


def get_graph():
    """Get the compiled graph (singleton)."""
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
