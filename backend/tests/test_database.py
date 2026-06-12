"""Tests for the database layer - conversation memory and tickets."""
import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.db.models import Base
from app.db.memory import ConversationMemory
from app.db.tickets import TicketRepository


@pytest.fixture
async def db_session():
    """Create an in-memory SQLite session for testing."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        yield session

    await engine.dispose()


class TestConversationMemory:
    """Test conversation persistence."""

    @pytest.mark.asyncio
    async def test_create_session(self, db_session):
        memory = ConversationMemory(db_session)
        session_id = await memory.create_session("NX01002", "employee")
        assert session_id is not None
        assert len(session_id) > 0

    @pytest.mark.asyncio
    async def test_add_and_get_messages(self, db_session):
        memory = ConversationMemory(db_session)
        session_id = await memory.create_session("NX01002", "employee")

        await memory.add_message(session_id, "user", "What are my benefits?")
        await memory.add_message(session_id, "assistant", "Here are your benefits...", "policy_agent")

        history = await memory.get_history(session_id)
        assert len(history) == 2
        assert history[0].content == "What are my benefits?"
        assert history[1].content == "Here are your benefits..."

    @pytest.mark.asyncio
    async def test_get_or_create_session(self, db_session):
        memory = ConversationMemory(db_session)

        # Create new when None
        session_id = await memory.get_or_create_session(None, "NX01002", "employee")
        assert session_id is not None

        # Reuse existing
        same_session = await memory.get_or_create_session(session_id, "NX01002", "employee")
        assert same_session == session_id

        # Create new if wrong employee
        diff_session = await memory.get_or_create_session(session_id, "NX01003", "employee")
        assert diff_session != session_id

    @pytest.mark.asyncio
    async def test_get_sessions_for_employee(self, db_session):
        memory = ConversationMemory(db_session)
        await memory.create_session("NX01002", "employee")
        await memory.create_session("NX01002", "employee")

        sessions = await memory.get_sessions_for_employee("NX01002")
        assert len(sessions) == 2

    @pytest.mark.asyncio
    async def test_auto_title(self, db_session):
        memory = ConversationMemory(db_session)
        session_id = await memory.create_session("NX01002", "employee")
        await memory.add_message(session_id, "user", "Tell me about stock options")

        sessions = await memory.get_sessions_for_employee("NX01002")
        assert sessions[0]["title"] == "Tell me about stock options"


class TestTicketRepository:
    """Test ticket database operations."""

    @pytest.mark.asyncio
    async def test_create_ticket(self, db_session):
        repo = TicketRepository(db_session)
        ticket = await repo.create_ticket(
            ticket_id="TKT-001",
            employee_id="NX01002",
            employee_name="Manish Hansen",
            title="Insurance claim issue",
            description="My medical claim was rejected",
            category="healthcare",
            priority="high",
        )
        assert ticket.id == "TKT-001"
        assert ticket.status == "open"

    @pytest.mark.asyncio
    async def test_get_employee_tickets(self, db_session):
        repo = TicketRepository(db_session)
        await repo.create_ticket("TKT-001", "NX01002", "Manish", "Issue 1", "Desc", "benefits")
        await repo.create_ticket("TKT-002", "NX01002", "Manish", "Issue 2", "Desc", "compensation")
        await repo.create_ticket("TKT-003", "NX01003", "Riya", "Issue 3", "Desc", "benefits")

        tickets = await repo.get_employee_tickets("NX01002")
        assert len(tickets) == 2

    @pytest.mark.asyncio
    async def test_update_ticket_status(self, db_session):
        repo = TicketRepository(db_session)
        await repo.create_ticket("TKT-001", "NX01002", "Manish", "Issue", "Desc", "benefits")

        updated = await repo.update_ticket_status("TKT-001", "resolved", "Fixed the issue")
        assert updated is not None
        assert updated.status == "resolved"
        assert updated.resolution == "Fixed the issue"
        assert updated.resolved_at is not None

    @pytest.mark.asyncio
    async def test_get_all_tickets_filtered(self, db_session):
        repo = TicketRepository(db_session)
        await repo.create_ticket("TKT-001", "NX01002", "Manish", "Open", "Desc", "benefits")
        await repo.create_ticket("TKT-002", "NX01002", "Manish", "Closed", "Desc", "benefits")
        await repo.update_ticket_status("TKT-002", "resolved")

        open_tickets = await repo.get_all_tickets(status="open")
        assert len(open_tickets) == 1
        assert open_tickets[0]["id"] == "TKT-001"
