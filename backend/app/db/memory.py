"""Conversation memory - persists multi-turn chat state per session."""
import uuid
import datetime
from typing import Optional

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage

from app.db.models import Conversation, Message


class ConversationMemory:
    """Manages conversation persistence in SQLite."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_session(self, employee_id: str, role: str) -> str:
        """Create a new conversation session."""
        session_id = str(uuid.uuid4())
        conv = Conversation(
            id=session_id,
            employee_id=employee_id,
            role=role,
        )
        self.db.add(conv)
        await self.db.commit()
        return session_id

    async def get_or_create_session(
        self, session_id: Optional[str], employee_id: str, role: str
    ) -> str:
        """Get existing session or create new one."""
        if session_id:
            result = await self.db.execute(
                select(Conversation).where(Conversation.id == session_id)
            )
            conv = result.scalar_one_or_none()
            if conv and conv.employee_id == employee_id:
                return session_id
        # Create new session
        return await self.create_session(employee_id, role)

    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        agent_used: str = "",
        intent: str = "",
    ):
        """Add a message to the conversation."""
        msg = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            agent_used=agent_used,
            intent=intent,
        )
        self.db.add(msg)
        # Update conversation timestamp
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conv = result.scalar_one_or_none()
        if conv:
            conv.updated_at = datetime.datetime.now(datetime.timezone.utc)
            # Auto-title from first user message
            if not conv.title and role == "user":
                conv.title = content[:100]
        await self.db.commit()

    async def get_history(
        self, conversation_id: str, limit: int = 20
    ) -> list[BaseMessage]:
        """Load conversation history as LangChain messages."""
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.id.desc())
            .limit(limit)
        )
        rows = result.scalars().all()
        rows = list(reversed(rows))  # Oldest first

        messages = []
        for row in rows:
            if row.role == "user":
                messages.append(HumanMessage(content=row.content))
            else:
                messages.append(AIMessage(content=row.content))
        return messages

    async def get_sessions_for_employee(
        self, employee_id: str, limit: int = 20
    ) -> list[dict]:
        """Get all conversation sessions for an employee."""
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.employee_id == employee_id)
            .order_by(desc(Conversation.updated_at))
            .limit(limit)
        )
        convs = result.scalars().all()
        return [
            {
                "id": c.id,
                "title": c.title or "Untitled",
                "created_at": c.created_at.isoformat() if c.created_at else "",
                "updated_at": c.updated_at.isoformat() if c.updated_at else "",
            }
            for c in convs
        ]
