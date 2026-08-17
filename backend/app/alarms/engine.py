import asyncio
import logging
import datetime
from typing import Dict, List, Any
from app.core.config import settings
from app.physics.state import reactor_state
from app.alarms.isa182 import AlarmObject, AlarmState, AlarmPriority

logger = logging.getLogger("argus.alarms")

class AlarmEngine:
    def __init__(self):
        self.alarms: Dict[str, AlarmObject] = {
            "ALM-001": AlarmObject(
                id="ALM-001",
                tag="TT-101",
                name="Core High-High Temperature Trip",
                priority=AlarmPriority.CRITICAL,
                priority_label="CRITICAL",
                color_hex=settings.COLOR_ALARM_CRITICAL,
                message="Core temperature exceeds SCRAM threshold"
            ),
            "ALM-002": AlarmObject(
                id="ALM-002",
                tag="PT-101",
                name="Vessel High Pressure Alarm",
                priority=AlarmPriority.HIGH,
                priority_label="HIGH",
                color_hex=settings.COLOR_ALARM_HIGH,
                message="Vessel pressure approaching safety trip limit"
            ),
            "ALM-003": AlarmObject(
                id="ALM-003",
                tag="TT-101",
                name="Core High Temperature Warning",
                priority=AlarmPriority.HIGH,
                priority_label="HIGH",
                color_hex=settings.COLOR_ALARM_HIGH,
                message="Core temperature above normal baseline"
            ),
            "ALM-004": AlarmObject(
                id="ALM-004",
                tag="IDS-01",
                name="False Data Injection Attack Intercepted",
                priority=AlarmPriority.CRITICAL,
                priority_label="CRITICAL",
                color_hex=settings.COLOR_ALARM_CRITICAL,
                message="Impossible physical jump flagged by PB-IDS"
            ),
            "ALM-005": AlarmObject(
                id="ALM-005",
                tag="FT-102",
                name="Low Coolant Flow Warning",
                priority=AlarmPriority.MEDIUM,
                priority_label="MEDIUM",
                color_hex=settings.COLOR_ALARM_MEDIUM,
                message="Coolant circulation flow below minimum threshold"
            ),
            "ALM-006": AlarmObject(
                id="ALM-006",
                tag="ESD-01",
                name="Emergency Stop SCRAM Engaged",
                priority=AlarmPriority.CRITICAL,
                priority_label="CRITICAL",
                color_hex=settings.COLOR_ALARM_CRITICAL,
                message="Operator initiated emergency plant shutdown"
            ),
            "ALM-007": AlarmObject(
                id="ALM-007",
                tag="SEC-01",
                name="Unauthorized Control Write Attempted",
                priority=AlarmPriority.CRITICAL,
                priority_label="CRITICAL",
                color_hex=settings.COLOR_ALARM_CRITICAL,
                message="Read-only user or unauthorized role attempted control action"
            ),
        }

    def evaluate_alarms(self):
        state = reactor_state

        # ALM-001: Core High-High Temp (> 85°C)
        if state.core_temp >= settings.CRITICAL_TEMP_TRIP:
            self.alarms["ALM-001"].trigger(f"{state.core_temp:.1f} °C", "Core temperature above 85.0°C critical limit!")
        else:
            self.alarms["ALM-001"].clear()

        # ALM-002: Vessel High Pressure (> 4.5 bar)
        if state.core_pressure >= settings.NORMAL_PRESSURE_MAX:
            self.alarms["ALM-002"].trigger(f"{state.core_pressure:.2f} bar", "Core pressure above 4.50 bar high threshold!")
        else:
            self.alarms["ALM-002"].clear()

        # ALM-003: Core High Temp Warning (> 75°C)
        if state.core_temp >= settings.NORMAL_TEMP_MAX:
            self.alarms["ALM-003"].trigger(f"{state.core_temp:.1f} °C", "Core temperature above 75.0°C warning threshold")
        else:
            self.alarms["ALM-003"].clear()

        # ALM-004: FDI Attack Active
        if state.deception_active:
            self.alarms["ALM-004"].trigger("ATTACK ACTIVE", "Active False Data Injection attack intercepted & neutralized")
        else:
            self.alarms["ALM-004"].clear()

        # ALM-005: Low Coolant Flow (< 10 L/min)
        if state.coolant_flow < 10.0:
            self.alarms["ALM-005"].trigger(f"{state.coolant_flow:.1f} L/min", "Coolant flow below 10.0 L/min minimum")
        else:
            self.alarms["ALM-005"].clear()

        # ALM-006: E-STOP Engaged
        if state.estop_active:
            reason_str = state.last_estop_reason or "Emergency Stop Triggered"
            self.alarms["ALM-006"].trigger("SCRAM ACTIVE", f"Plant SCRAM: {reason_str}")
        else:
            self.alarms["ALM-006"].clear()

    def get_summary(self) -> Dict[str, Any]:
        self.evaluate_alarms()
        alarm_list = [a.dict() for a in self.alarms.values()]
        
        active_count = sum(1 for a in self.alarms.values() if a.state in [AlarmState.UNACK, AlarmState.ACK])
        unack_count = sum(1 for a in self.alarms.values() if a.state in [AlarmState.UNACK, AlarmState.RTN_UNACK])
        
        highest_sev = "NORMAL"
        if any(a.priority == AlarmPriority.CRITICAL and a.state in [AlarmState.UNACK, AlarmState.ACK] for a in self.alarms.values()):
            highest_sev = "CRITICAL"
        elif any(a.priority == AlarmPriority.HIGH and a.state in [AlarmState.UNACK, AlarmState.ACK] for a in self.alarms.values()):
            highest_sev = "HIGH"
        elif any(a.priority == AlarmPriority.MEDIUM and a.state in [AlarmState.UNACK, AlarmState.ACK] for a in self.alarms.values()):
            highest_sev = "MEDIUM"

        return {
            "active_count": active_count,
            "unack_count": unack_count,
            "highest_severity": highest_sev,
            "list": alarm_list
        }

alarm_engine = AlarmEngine()
