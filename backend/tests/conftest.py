"""Shared test fixtures and configuration."""
import os
import pytest
import asyncio
from unittest.mock import patch, MagicMock

# Set test environment
os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./data/test.db"
os.environ["ANTHROPIC_API_KEY"] = "test-key"
os.environ["CHROMA_PERSIST_DIR"] = "./data/test_vectorstore"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_settings():
    """Mock application settings."""
    from app.config import Settings
    return Settings(
        anthropic_api_key="test-key",
        anthropic_model="claude-sonnet-4-20250514",
        database_url="sqlite+aiosqlite:///./data/test.db",
        chroma_persist_dir="./data/test_vectorstore",
        chroma_collection_name="test_collection",
        rag_documents_dir="./data/RAG Documents",
        employee_directory_path="./data/RAG Documents/nexacore_employee_directory.csv",
    )


@pytest.fixture
def sample_employee_profile():
    """Sample employee profile for testing."""
    from app.auth.employee_context import EmployeeProfile
    return EmployeeProfile(
        employee_id="NX01002",
        employee_name="Manish Hansen",
        email="manish.hansen1002@nexacore.com",
        department="Engineering",
        business_unit="Platform Engineering",
        designation="Staff Engineer",
        grade="E4",
        manager_id="NX01659",
        manager_name="Alex Lim",
        location="Pune, India",
        joining_date="2019-12-15",
        employment_type="Full-Time",
        leave_balance=27,
        work_mode="Office",
        phone_extension="7793",
    )
