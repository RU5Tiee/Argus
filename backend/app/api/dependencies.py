from fastapi import Depends, HTTPException, Header
from app.core.rbac import UserRole, get_role_permissions, UserPermissions

async def get_current_user_role(x_user_role: str = Header(default="OPERATOR")) -> UserRole:
    try:
        return UserRole(x_user_role.upper())
    except ValueError:
        return UserRole.OPERATOR

async def get_permissions(role: UserRole = Depends(get_current_user_role)) -> UserPermissions:
    return get_role_permissions(role)
