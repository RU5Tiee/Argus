from pydantic import BaseModel, Field
from typing import Optional

class ValueDisplay(BaseModel):
    raw: float
    formatted: str
    status: str = "normal"  # "normal" | "warning" | "critical"
    status_color: str = "#F8FAFC"
    unit: str = ""

class ActuatorState(BaseModel):
    state: bool
    formatted: str  # "OPEN"/"CLOSED", "RUNNING"/"OFF"
    modbus_address: str

class TargetSetpoints(BaseModel):
    target_rpm: float = 3000.0
    target_temp: float = 75.0
    target_pressure: float = 2.5
    target_fuel_pressure: float = 4.5

class CorePhysicsData(BaseModel):
    fuel_pressure: ValueDisplay
    fuel_flow: ValueDisplay
    core_temp: ValueDisplay
    core_pressure: ValueDisplay
    steam_temp: ValueDisplay
    steam_pressure: ValueDisplay
    turbine_torque: ValueDisplay
    turbine_rpm: ValueDisplay
    generator_output: ValueDisplay
    electrical_power: ValueDisplay
    coolant_flow: ValueDisplay
    coolant_temp: ValueDisplay
    vessel_level: ValueDisplay
