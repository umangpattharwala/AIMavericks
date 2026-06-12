"""Tests for the agent graph - orchestration and routing."""
import pytest
from unittest.mock import patch, MagicMock
from langchain_core.messages import HumanMessage, AIMessage

from app.agents.state import AgentState
from app.agents.orchestrator import orchestrator_node, route_to_agent
from app.auth.rbac import UserRole


class TestAgentState:
    """Test agent state model."""

    def test_default_state(self):
        state = AgentState()
        assert state.messages == []
        assert state.role == UserRole.EMPLOYEE
        assert state.intent == ""
        assert state.target_agent == ""

    def test_state_with_context(self):
        state = AgentState(
            messages=[HumanMessage(content="What are my benefits?")],
            employee_id="NX01002",
            employee_name="Manish Hansen",
            role=UserRole.EMPLOYEE,
            department="Engineering",
            grade="E4",
            location="Pune, India",
            employment_type="Full-Time",
        )
        assert state.employee_id == "NX01002"
        assert state.role == UserRole.EMPLOYEE
        assert len(state.messages) == 1


class TestRouting:
    """Test routing logic."""

    def test_route_policy_agent(self):
        state = AgentState(
            target_agent="policy_agent",
            role=UserRole.EMPLOYEE,
            needs_clarification=False,
        )
        result = route_to_agent(state)
        assert result == "policy_agent"

    def test_route_rewards_agent(self):
        state = AgentState(
            target_agent="rewards_agent",
            role=UserRole.EMPLOYEE,
            needs_clarification=False,
        )
        result = route_to_agent(state)
        assert result == "rewards_agent"

    def test_route_ticket_agent(self):
        state = AgentState(
            target_agent="ticket_agent",
            role=UserRole.EMPLOYEE,
            needs_clarification=False,
        )
        result = route_to_agent(state)
        assert result == "ticket_agent"

    def test_route_research_denied_for_employee(self):
        state = AgentState(
            target_agent="research_agent",
            role=UserRole.EMPLOYEE,
            needs_clarification=False,
        )
        result = route_to_agent(state)
        assert result == "access_denied"

    def test_route_research_allowed_for_hr(self):
        state = AgentState(
            target_agent="research_agent",
            role=UserRole.HR,
            needs_clarification=False,
        )
        result = route_to_agent(state)
        assert result == "research_agent"

    def test_route_clarification(self):
        state = AgentState(
            target_agent="policy_agent",
            role=UserRole.EMPLOYEE,
            needs_clarification=True,
        )
        result = route_to_agent(state)
        assert result == "clarify"


class TestOrchestratorNode:
    """Test orchestrator with mocked LLM."""

    @patch("app.agents.orchestrator.create_orchestrator")
    def test_orchestrator_routes_policy(self, mock_create):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(
            content='{"intent": "policy question", "target_agent": "policy_agent", "requires_escalation": false}'
        )
        mock_create.return_value = mock_llm

        state = AgentState(
            messages=[HumanMessage(content="What is the leave policy?")],
            employee_name="Test User",
            employee_id="NX01001",
            role=UserRole.EMPLOYEE,
            department="Engineering",
            grade="E4",
            location="Pune, India",
            employment_type="Full-Time",
            work_mode="Office",
        )

        result = orchestrator_node(state)
        assert result["target_agent"] == "policy_agent"
        assert result["intent"] == "policy question"

    @patch("app.agents.orchestrator.create_orchestrator")
    def test_orchestrator_handles_malformed_json(self, mock_create):
        mock_llm = MagicMock()
        mock_llm.invoke.return_value = MagicMock(content="not valid json")
        mock_create.return_value = mock_llm

        state = AgentState(
            messages=[HumanMessage(content="hello")],
            employee_name="Test User",
            employee_id="NX01001",
            role=UserRole.EMPLOYEE,
        )

        result = orchestrator_node(state)
        # Should default to policy_agent
        assert result["target_agent"] == "policy_agent"
