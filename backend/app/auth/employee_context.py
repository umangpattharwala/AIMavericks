"""Employee context loader - loads employee profile from directory CSV."""
import pandas as pd
from typing import Optional
from pydantic import BaseModel
from functools import lru_cache

from app.config import get_settings


class EmployeeProfile(BaseModel):
    employee_id: str
    employee_name: str
    email: str
    department: str
    business_unit: str
    designation: str
    grade: str
    manager_id: str
    manager_name: str
    location: str
    joining_date: str
    employment_type: str  # Full-Time, Part-Time, Contract
    leave_balance: int
    work_mode: str  # Remote, Office, Hybrid
    phone_extension: str

    model_config = {"coerce_numbers_to_str": True}


class EmployeeDirectory:
    """Loads and queries the employee directory for context injection."""

    def __init__(self):
        settings = get_settings()
        self._df = pd.read_csv(settings.employee_directory_path)

    def get_employee_by_id(self, employee_id: str) -> Optional[EmployeeProfile]:
        row = self._df[self._df["employee_id"] == employee_id]
        if row.empty:
            return None
        record = row.iloc[0].to_dict()
        return EmployeeProfile(**record)

    def get_employee_by_email(self, email: str) -> Optional[EmployeeProfile]:
        row = self._df[self._df["email"] == email]
        if row.empty:
            return None
        record = row.iloc[0].to_dict()
        return EmployeeProfile(**record)

    def get_all_departments(self) -> list[str]:
        return self._df["department"].unique().tolist()

    def get_all_locations(self) -> list[str]:
        return self._df["location"].unique().tolist()

    def get_employees_by_department(self, department: str) -> list[EmployeeProfile]:
        rows = self._df[self._df["department"] == department]
        return [EmployeeProfile(**row.to_dict()) for _, row in rows.iterrows()]


@lru_cache()
def get_employee_directory() -> EmployeeDirectory:
    return EmployeeDirectory()
