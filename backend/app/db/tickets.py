"""Ticket repository - SQLite backed ticket store."""
import datetime
from typing import Optional

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Ticket


class TicketRepository:
    """Manages support tickets in SQLite."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_ticket(
        self,
        ticket_id: str,
        employee_id: str,
        employee_name: str,
        title: str,
        description: str,
        category: str,
        priority: str = "medium",
    ) -> Ticket:
        """Create a new support ticket."""
        ticket = Ticket(
            id=ticket_id,
            employee_id=employee_id,
            employee_name=employee_name,
            title=title,
            description=description,
            category=category,
            priority=priority,
        )
        self.db.add(ticket)
        await self.db.commit()
        await self.db.refresh(ticket)
        return ticket

    async def get_ticket(self, ticket_id: str) -> Optional[Ticket]:
        result = await self.db.execute(select(Ticket).where(Ticket.id == ticket_id))
        return result.scalar_one_or_none()

    async def get_employee_tickets(self, employee_id: str) -> list[dict]:
        result = await self.db.execute(
            select(Ticket)
            .where(Ticket.employee_id == employee_id)
            .order_by(desc(Ticket.created_at))
        )
        tickets = result.scalars().all()
        return [self._to_dict(t) for t in tickets]

    async def get_all_tickets(
        self, status: Optional[str] = None, limit: int = 100
    ) -> list[dict]:
        query = select(Ticket).order_by(desc(Ticket.created_at)).limit(limit)
        if status:
            query = query.where(Ticket.status == status)
        result = await self.db.execute(query)
        tickets = result.scalars().all()
        return [self._to_dict(t) for t in tickets]

    async def update_ticket_status(
        self, ticket_id: str, status: str, resolution: str = ""
    ) -> Optional[Ticket]:
        ticket = await self.get_ticket(ticket_id)
        if not ticket:
            return None
        ticket.status = status
        ticket.updated_at = datetime.datetime.now(datetime.timezone.utc)
        if status == "resolved":
            ticket.resolved_at = datetime.datetime.now(datetime.timezone.utc)
            ticket.resolution = resolution
        await self.db.commit()
        return ticket

    def _to_dict(self, ticket: Ticket) -> dict:
        return {
            "id": ticket.id,
            "employee_id": ticket.employee_id,
            "employee_name": ticket.employee_name,
            "title": ticket.title,
            "description": ticket.description,
            "category": ticket.category,
            "priority": ticket.priority,
            "status": ticket.status,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else "",
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else "",
            "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
            "resolution": ticket.resolution,
        }
