import datetime
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.core.config import settings

class AlarmState(str, Enum):
    NORMAL = "NORMAL"
    UNACK = "UNACK"
    ACK = "ACK"
    RTN_UNACK = "RTN_UNACK"
    SHELVED = "SHELVED"

class AlarmPriority(int, Enum):
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4

class AlarmObject(BaseModel):
    id: str                 # "ALM-001"
    tag: str                # "TT-101"
    name: str               # "High Core Temperature"
    priority: AlarmPriority
    priority_label: str     # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    color_hex: str          # "#EF4444"
    state: AlarmState = AlarmState.NORMAL
    timestamp: str = ""
    message: str = ""
    value_formatted: str = ""
    operator: str = "SYSTEM"
    reason: Optional[str] = None
    shelved_until: Optional[str] = None

    def trigger(self, value_str: str, msg: str):
        """Transition state machine when threshold violated."""
        if self.state == AlarmState.NORMAL:
            self.state = AlarmState.UNACK
            self.timestamp = datetime.datetime.utcnow().isoformat() + "Z"
            self.value_formatted = value_str
            self.message = msg
        elif self.state == AlarmState.ACK:
            # Process still in alarm state, remains ACK
            self.value_formatted = value_str
            self.message = msg

    def clear(self):
        """Transition state machine when process returns to normal."""
        if self.state == AlarmState.UNACK:
            self.state = AlarmState.RTN_UNACK
        elif self.state == AlarmState.ACK:
            self.state = AlarmState.NORMAL

    def acknowledge(self, operator: str = "OPERATOR"):
        """Operator acknowledges alarm."""
        if self.state in [AlarmState.UNACK, AlarmState.RTN_UNACK]:
            self.state = AlarmState.ACK if self.state == AlarmState.UNACK else AlarmState.NORMAL
            self.operator = operator

    def shelve(self, duration_minutes: int = 30, operator: str = "OPERATOR", reason: str = "Maintenance"):
        """Shelve alarm for specific duration."""
        self.state = AlarmState.SHELVED
        self.operator = operator
        self.reason = reason
        self.shelved_until = (datetime.datetime.utcnow() + datetime.timedelta(minutes=duration_minutes)).isoformat() + "Z"
