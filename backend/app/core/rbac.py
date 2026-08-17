from enum import Enum
from typing import List
from pydantic import BaseModel

class UserRole(str, Enum):
    OPERATOR = "OPERATOR"
    SOC_ANALYST = "SOC_ANALYST"
    ENGINEER = "ENGINEER"
    ADMINISTRATOR = "ADMINISTRATOR"
    AUDITOR = "AUDITOR"

class UserPermissions(BaseModel):
    role: UserRole
    can_toggle_actuators: bool
    can_change_setpoints: bool
    can_trigger_estop: bool
    can_shelve_alarms: bool
    can_reset_system: bool

ROLE_PERMISSIONS = {
    UserRole.OPERATOR: UserPermissions(
        role=UserRole.OPERATOR,
        can_toggle_actuators=True,
        can_change_setpoints=True,
        can_trigger_estop=True,
        can_shelve_alarms=True,
        can_reset_system=False,
    ),
    UserRole.SOC_ANALYST: UserPermissions(
        role=UserRole.SOC_ANALYST,
        can_toggle_actuators=False,
        can_change_setpoints=False,
        can_trigger_estop=True,
        can_shelve_alarms=True,
        can_reset_system=False,
    ),
    UserRole.ENGINEER: UserPermissions(
        role=UserRole.ENGINEER,
        can_toggle_actuators=True,
        can_change_setpoints=True,
        can_trigger_estop=True,
        can_shelve_alarms=True,
        can_reset_system=True,
    ),
    UserRole.ADMINISTRATOR: UserPermissions(
        role=UserRole.ADMINISTRATOR,
        can_toggle_actuators=True,
        can_change_setpoints=True,
        can_trigger_estop=True,
        can_shelve_alarms=True,
        can_reset_system=True,
    ),
    UserRole.AUDITOR: UserPermissions(
        role=UserRole.AUDITOR,
        can_toggle_actuators=False,
        can_change_setpoints=False,
        can_trigger_estop=False,
        can_shelve_alarms=False,
        can_reset_system=False,
    ),
}

def get_role_permissions(role: UserRole) -> UserPermissions:
    return ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS[UserRole.OPERATOR])
