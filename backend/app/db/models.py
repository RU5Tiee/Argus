import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from app.db.database import Base

class SecurityEventLog(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    event_type = Column(String, index=True) # "FDI_ATTACK", "CUSUM_VIOLATION", "DOS_ATTACK", "UNAUTHORIZED_WRITE"
    source_ip = Column(String, default="127.0.0.1")
    target_register = Column(String) # "%QW0.0", "%QX0.2"
    function_code = Column(Integer)  # 5, 6, 16
    injected_payload = Column(Float)
    deception_overwritten_value = Column(Float)
    mitre_technique_id = Column(String, default="T0836")
    mitre_technique_name = Column(String, default="Modify Parameter")
    attack_chain_phase = Column(String, default="Impair Process Control")
    details = Column(Text)

class AlarmHistoryLog(Base):
    __tablename__ = "alarm_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    alarm_id = Column(String, index=True) # "ALM-001"
    tag = Column(String)                 # "TT-101"
    alarm_name = Column(String)          # "High Core Temperature"
    priority = Column(Integer)           # 1, 2, 3, 4
    priority_label = Column(String)     # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    state = Column(String)              # "UNACK", "ACK", "RTN_UNACK", "NORMAL", "SHELVED"
    value_formatted = Column(String)
    operator = Column(String, default="SYSTEM")
    reason = Column(Text, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    operator = Column(String)
    action = Column(String) # "ESTOP_TRIGGERED", "SETPOINT_CHANGED", "VALVE_TOGGLED", "ALARM_SHELVED"
    details = Column(Text)
