import os
from pydantic import BaseModel

class SystemConfig(BaseModel):
    APP_NAME: str = "Argus Cyber-Physical Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Network & PLC Configuration
    MODBUS_HOST: str = os.getenv("MODBUS_HOST", "127.0.0.1")
    MODBUS_PORT: int = int(os.getenv("MODBUS_PORT", "502"))
    SIMULATION_HZ: float = 10.0  # 10Hz integration cycle (dt = 0.1s)
    DELTA_T: float = 0.1
    
    # SQLite WAL Database Path
    DB_PATH: str = os.getenv("DB_PATH", "ot_security.db")
    
    # Physical Limits & Safety Interlocks (per research_brief.md)
    MAX_TEMP_JUMP_PER_SEC: float = 2.5   # °C/sec limit
    MAX_TEMP_JUMP_PER_CYCLE: float = 0.25 # °C per 100ms cycle
    MAX_PRESSURE_JUMP_PER_SEC: float = 0.20 # bar/sec
    MAX_PRESSURE_JUMP_PER_CYCLE: float = 0.02 # bar per 100ms cycle
    
    # Operating Ranges
    NORMAL_TEMP_MIN: float = 20.0
    NORMAL_TEMP_MAX: float = 75.0
    CRITICAL_TEMP_TRIP: float = 85.0
    SCRAM_TEMP_TRIP: float = 90.0
    
    NORMAL_PRESSURE_MIN: float = 1.0
    NORMAL_PRESSURE_MAX: float = 4.5
    CRITICAL_PRESSURE_TRIP: float = 6.0
    SCRAM_PRESSURE_TRIP: float = 8.0
    
    NORMAL_LEVEL_MIN: float = 20.0
    NORMAL_LEVEL_MAX: float = 85.0
    LOW_LEVEL_INHIBIT: float = 10.0
    
    # ISA-101 Theme Hex Tokens
    BG_PRIMARY: str = "#0B0F19"
    BG_CARD: str = "#151D2A"
    BORDER_COLOR: str = "#1E293B"
    TEXT_PRIMARY: str = "#F8FAFC"
    TEXT_MUTED: str = "#64748B"
    COLOR_INACTIVE: str = "#475569"
    COLOR_FLOW_CYAN: str = "#0EA5E9"
    COLOR_ALARM_CRITICAL: str = "#EF4444"
    COLOR_ALARM_HIGH: str = "#F97316"
    COLOR_ALARM_MEDIUM: str = "#EAB308"
    COLOR_ALARM_LOW: str = "#06B6D4"

settings = SystemConfig()
