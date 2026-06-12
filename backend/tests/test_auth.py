"""Tests for authentication and employee context."""
import pytest
from app.auth.employee_context import get_employee_directory, EmployeeProfile
from app.auth.rbac import UserRole, create_access_token, UserSession


class TestEmployeeDirectory:
    """Test employee directory loading and lookup."""

    def test_load_directory(self):
        directory = get_employee_directory()
        assert directory is not None

    def test_get_employee_by_id(self):
        directory = get_employee_directory()
        profile = directory.get_employee_by_id("NX01002")
        assert profile is not None
        assert profile.employee_name == "Manish Hansen"
        assert profile.department == "Engineering"
        assert profile.grade == "E4"

    def test_get_employee_not_found(self):
        directory = get_employee_directory()
        profile = directory.get_employee_by_id("INVALID")
        assert profile is None

    def test_get_employee_by_email(self):
        directory = get_employee_directory()
        profile = directory.get_employee_by_email("manish.hansen1002@nexacore.com")
        assert profile is not None
        assert profile.employee_id == "NX01002"

    def test_get_all_departments(self):
        directory = get_employee_directory()
        depts = directory.get_all_departments()
        assert len(depts) > 0
        assert "Engineering" in depts

    def test_get_all_locations(self):
        directory = get_employee_directory()
        locations = directory.get_all_locations()
        assert len(locations) > 0


class TestRBAC:
    """Test role-based access control."""

    def test_create_token_employee(self):
        token = create_access_token("NX01002", UserRole.EMPLOYEE)
        assert token is not None
        assert len(token) > 0

    def test_create_token_hr(self):
        token = create_access_token("NX01002", UserRole.HR)
        assert token is not None

    def test_user_roles(self):
        assert UserRole.EMPLOYEE.value == "employee"
        assert UserRole.HR.value == "hr"
        assert UserRole.ADMIN.value == "admin"
