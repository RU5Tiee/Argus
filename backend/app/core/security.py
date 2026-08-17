import datetime
import logging
import jwt
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status, Header
from pydantic import BaseModel

from app.core.config import settings
from app.core.rbac import UserRole, get_role_permissions, UserPermissions

logger = logging.getLogger("argus.security")

# Secret key & algorithm for JWT tokens
JWT_SECRET_KEY = "ARGUS_OT_SECURITY_SUPER_SECRET_JWT_KEY_2026"
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 480  # 8 hours

class TokenData(BaseModel):
    username: str
    role: UserRole

# Pre-seeded users for OT Control Room testing
USERS_DB = {
    "admin": {
        "username": "admin",
        "password": "adminpassword",
        "role": UserRole.ADMINISTRATOR,
        "name": "System Administrator (Level 3)"
    },
    "operator": {
        "username": "operator",
        "password": "operatorpassword",
        "role": UserRole.OPERATOR,
        "name": "Control Room Operator (Level 2)"
    },
    "auditor": {
        "username": "auditor",
        "password": "auditorpassword",
        "role": UserRole.AUDITOR,
        "name": "Security Compliance Auditor (Read-Only)"
    }
}

def create_access_token(username: str, role: UserRole) -> str:
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": username,
        "role": role.value,
        "exp": expire,
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        username: str = payload.get("sub")
        role_str: str = payload.get("role")
        if username is None or role_str is None:
            return None
        return TokenData(username=username, role=UserRole(role_str))
    except (jwt.PyJWTError, ValueError):
        return None

async def get_current_user(authorization: Optional[str] = Header(default=None)) -> TokenData:
    """Extract and validate Bearer JWT token from HTTP Authorization header."""
    if not authorization:
        # Default to AUDITOR (Read-only) for unauthenticated HTTP requests
        return TokenData(username="anonymous", role=UserRole.AUDITOR)

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return TokenData(username="anonymous", role=UserRole.AUDITOR)

    token = parts[1]
    token_data = decode_access_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"status": "error", "message": "Invalid or expired JWT authentication token"}
        )
    return token_data

async def require_write_permission(user: TokenData = Depends(get_current_user)):
    """
    Enforces RBAC write permission. If AUDITOR tries to execute write operations,
    logs unauthorized access to SQLite WAL, raises ALM-007 in ISA-18.2 engine, and raises 403.
    """
    perms = get_role_permissions(user.role)
    if not perms.can_toggle_actuators:
        # Import lazily to prevent circular import loops
        from app.alarms.engine import alarm_engine
        from app.mitre.attack_chain import attack_chain_tracker
        from app.db.database import AsyncSessionLocal
        from app.db.models import SecurityEventLog

        # 1. Trigger ISA-18.2 Alarm ALM-007
        if "ALM-007" in alarm_engine.alarms:
            alarm_engine.alarms["ALM-007"].trigger(
                f"User: {user.username}",
                f"UNAUTHORIZED WRITE ATTEMPT by read-only role '{user.role.value}'"
            )

        # 2. Register MITRE Technique T0858 (Valid Accounts / Unauthorized Command)
        attack_chain_tracker.register_threat_event("T0858")

        # 3. Log event asynchronously to SQLite WAL
        async def _log_unauthorized():
            async with AsyncSessionLocal() as db:
                db.add(SecurityEventLog(
                    timestamp=datetime.datetime.utcnow(),
                    event_type="UNAUTHORIZED_WRITE_ATTEMPT",
                    source_ip="127.0.0.1",
                    target_register="CONTROL_API",
                    function_code=6,
                    injected_payload=0.0,
                    deception_overwritten_value=0.0,
                    mitre_technique_id="T0858",
                    mitre_technique_name="Valid Accounts / Privilege Violation",
                    attack_chain_phase="Initial Access",
                    details=f"Read-only user '{user.username}' ({user.role.value}) attempted unauthorized control action."
                ))
                await db.commit()

        import asyncio
        asyncio.create_task(_log_unauthorized())

        logger.warning(f"SECURITY ALERT: Unauthorized write attempt by user '{user.username}' with role '{user.role.value}'")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "status": "FORBIDDEN",
                "code": 403,
                "message": f"User '{user.username}' with role '{user.role.value}' lacks write permissions.",
                "security_action": "Event logged to SOC threat stream and ALM-007 alarm raised.",
                "required_roles": ["ADMINISTRATOR", "OPERATOR"]
            }
        )
    return user
