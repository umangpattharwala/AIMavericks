"""SQLAlchemy models for conversation memory and tickets."""
import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, JSON
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Conversation(Base):
    """Stores conversation sessions."""
    __tablename__ = "conversations"

    id = Column(String(64), primary_key=True)
    employee_id = Column(String(16), nullable=False, index=True)
    role = Column(String(16), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    title = Column(String(256), default="")
    metadata_ = Column("metadata", JSON, default=dict)


class Message(Base):
    """Stores individual messages within a conversation."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(String(64), nullable=False, index=True)
    role = Column(String(16), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    agent_used = Column(String(64), default="")
    intent = Column(String(128), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    metadata_ = Column("metadata", JSON, default=dict)


class Ticket(Base):
    """Support tickets for benefits issues."""
    __tablename__ = "tickets"

    id = Column(String(32), primary_key=True)
    employee_id = Column(String(16), nullable=False, index=True)
    employee_name = Column(String(128), nullable=False)
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(32), nullable=False)
    priority = Column(String(16), default="medium")
    status = Column(String(16), default="open")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolution = Column(Text, default="")
