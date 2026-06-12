"""Integration tests for API endpoints."""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient

from app.auth.rbac import create_access_token, UserRole


@pytest.fixture
def client():
    """Create a test client."""
    from app.main import app
    return TestClient(app)


@pytest.fixture
def employee_token():
    return create_access_token("NX01002", UserRole.EMPLOYEE)


@pytest.fixture
def hr_token():
    return create_access_token("NX01002", UserRole.HR)


class TestHealthEndpoint:
    def test_health_check(self, client):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestAuthEndpoints:
    def test_login_valid_employee(self, client):
        response = client.post("/api/auth/login", json={
            "employee_id": "NX01002",
            "role": "employee",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["employee_name"] == "Manish Hansen"
        assert data["role"] == "employee"

    def test_login_as_hr(self, client):
        response = client.post("/api/auth/login", json={
            "employee_id": "NX01002",
            "role": "hr",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "hr"

    def test_login_invalid_employee(self, client):
        response = client.post("/api/auth/login", json={
            "employee_id": "INVALID_ID",
            "role": "employee",
        })
        assert response.status_code == 404

    def test_get_me_authenticated(self, client, employee_token):
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {employee_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["employee_id"] == "NX01002"
        assert data["department"] == "Engineering"

    def test_get_me_unauthenticated(self, client):
        response = client.get("/api/auth/me")
        assert response.status_code == 401


class TestAccessControl:
    def test_employee_cannot_access_directory(self, client, employee_token):
        response = client.get(
            "/api/employees/directory",
            headers={"Authorization": f"Bearer {employee_token}"},
        )
        assert response.status_code == 403

    def test_hr_can_access_directory(self, client, hr_token):
        response = client.get(
            "/api/employees/directory",
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "departments" in data
        assert "locations" in data
