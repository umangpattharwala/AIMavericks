"""LangGraph state definitions for the multi-agent system."""
from typing import Annotated, Optional, Literal
from pydantic import BaseModel, Field
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage

from app.auth.rbac import UserRole


class AgentState(BaseModel):
    """Shared state across all agents in the graph."""

    # Conversation
    messages: Annotated[list[BaseMessage], add_messages] = Field(default_factory=list)

    # User context (injected at start)
    employee_id: str = ""
    employee_name: str = ""
    role: UserRole = UserRole.EMPLOYEE
    department: str = ""
    grade: str = ""
    location: str = ""
    employment_type: str = ""
    work_mode: str = ""
    joining_date: str = ""

    # Routing
    intent: str = ""  # Classified intent from orchestrator
    target_agent: str = ""  # Which agent to route to
    requires_escalation: bool = False

    # RAG context
    retrieved_documents: list[str] = Field(default_factory=list)
    document_categories: list[str] = Field(default_factory=list)

    # Ticket state (for ticket agent)
    ticket_summary: str = ""
    ticket_category: str = ""
    ticket_status: str = ""

    # Research state (for HR research agent)
    research_query: str = ""
    research_results: list[str] = Field(default_factory=list)

    # Life event state (for life event simulator)
    life_event_type: str = ""
    impact_dimensions: list[str] = Field(default_factory=list)

    # Equity analysis state (for equity agent)
    equity_scope: str = ""
    anomalies_detected: list[str] = Field(default_factory=list)

    # Control flow
    iteration_count: int = 0
    max_iterations: int = 3
    final_response: str = ""
    needs_clarification: bool = False


class TicketRequest(BaseModel):
    """Schema for ticket creation."""
    title: str
    description: str
    category: Literal["benefits", "compensation", "healthcare", "stock_options", "reimbursement", "other"]
    priority: Literal["low", "medium", "high"] = "medium"
    employee_id: str = ""
