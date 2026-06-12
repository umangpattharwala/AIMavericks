"""Role-based access control for employee vs HR personas."""
from enum import Enum
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.config import get_settings
from app.auth.employee_context import get_employee_directory, EmployeeProfile


class UserRole(str, Enum):
    EMPLOYEE = "employee"
    HR = "hr"
    ADMIN = "admin"


class UserSession(BaseModel):
    employee_id: str
    role: UserRole
    profile: EmployeeProfile


class TokenPayload(BaseModel):
    employee_id: str
    role: UserRole
    exp: Optional[datetime] = None


security = HTTPBearer()


def create_access_token(employee_id: str, role: UserRole) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "employee_id": employee_id,
        "role": role.value,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> TokenPayload:
    settings = get_settings()
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return TokenPayload(
            employee_id=payload["employee_id"],
            role=UserRole(payload["role"]),
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_current_user(token: TokenPayload = Depends(verify_token)) -> UserSession:
    directory = get_employee_directory()
    profile = directory.get_employee_by_id(token.employee_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee {token.employee_id} not found in directory",
        )
    return UserSession(
        employee_id=token.employee_id,
        role=token.role,
        profile=profile,
    )


def require_role(allowed_roles: list[UserRole]):
    """Dependency that enforces role-based access."""
    def role_checker(user: UserSession = Depends(get_current_user)) -> UserSession:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role.value}' not authorized for this action",
            )
        return user
    return role_checker
