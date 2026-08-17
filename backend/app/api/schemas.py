from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class LoginRequest(BaseModel):
    username: str = Field(..., example="operator")
    password: str = Field(..., example="operatorpassword")

class LoginResponse(BaseModel):
    status: str = "success"
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str
    user_name: str
    permissions: Dict[str, Any]

class EstopRequest(BaseModel):
    operator: str = Field(default="OPERATOR_CONSOLE", description="Name/ID of operator initiating E-STOP")
    reason: str = Field(default="Manual Emergency Trip Initiated", description="Reason for E-STOP actuation")

class SetpointRequest(BaseModel):
    target_rpm: Optional[float] = None
    target_temp: Optional[float] = None
    target_pressure: Optional[float] = None
    target_fuel_pressure: Optional[float] = None

class ActuatorRequest(BaseModel):
    actuator_name: str
    state: bool

class AlarmAckRequest(BaseModel):
    alarm_id: str
    operator: str = "OPERATOR"

class AlarmShelveRequest(BaseModel):
    alarm_id: str
    duration_minutes: int = 30
    operator: str = "OPERATOR"
    reason: str = "Scheduled Maintenance"

class AlarmClearRequest(BaseModel):
    alarm_id: str
    operator: str = "OPERATOR"

class AttackSimRequest(BaseModel):
    target_register: str = "%QW0.0"
    injected_value: float = 150.0
    source_ip: str = "192.168.1.105"
    technique_id: str = "T0836"

class StartScenarioRequest(BaseModel):
    scenario_id: str = Field(..., example="fdi_injection")
    attacker_ip: str = Field(default="192.168.1.105")

class SystemModeRequest(BaseModel):
    vulnerable_mode: bool

