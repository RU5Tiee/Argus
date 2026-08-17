import asyncio
import random
import datetime
from typing import Dict, Any, Optional
from app.core.config import settings
from app.physics.models import ValueDisplay, ActuatorState, TargetSetpoints

class ReactorState:
    def __init__(self):
        self._lock = asyncio.Lock()
        
        # System status flags
        self.estop_active: bool = False
        self.deception_active: bool = False
        self.vulnerable_mode: bool = False
        self.system_status: str = "NORMAL"  # "NORMAL", "WARNING", "CRITICAL", "SCRAM", "DECEPTION_ACTIVE"
        
        # Raw internal physical state variables
        self.fuel_pressure: float = 4.2      # bar
        self.fuel_flow: float = 17.64         # L/min
        self.core_temp: float = 45.0          # °C
        self.core_pressure: float = 2.4       # bar
        self.steam_temp: float = 110.0        # °C
        self.steam_pressure: float = 4.8      # bar
        self.turbine_torque: float = 1056.0   # N·m
        self.turbine_rpm: float = 3000.0      # RPM
        self.generator_output: float = 98.2   # %
        self.electrical_power: float = 49.1   # MW
        self.coolant_flow: float = 45.0       # L/min
        self.coolant_temp: float = 28.5       # °C
        self.vessel_level: float = 65.0       # %

        # Setpoint Targets
        self.setpoints = TargetSetpoints(
            target_rpm=3000.0,
            target_temp=75.0,
            target_pressure=2.5,
            target_fuel_pressure=4.5
        )

        # Actuator states (Modbus mapping)
        self.fuel_valve: bool = True       # %QX0.0 (V-101)
        self.coolant_pump: bool = True     # %QX0.1 (M-201)
        self.heater_jacket: bool = True    # %QX0.2 (HTR-101)
        self.relief_valve: bool = False    # %QX0.3 (RV-101)

        # Last E-STOP event metadata
        self.last_estop_operator: Optional[str] = None
        self.last_estop_timestamp: Optional[str] = None
        self.last_estop_reason: Optional[str] = None

    def add_jitter(self, value: float, sigma: float = 0.15) -> float:
        """Add realistic Gaussian ADC sensor noise."""
        return value + random.gauss(0, sigma)

    def evaluate_status(self, value: float, warn_min: float, warn_max: float, crit_max: float) -> tuple[str, str]:
        """Evaluate server-side status label and ISA-101 color code."""
        if self.estop_active:
            return "scram", settings.COLOR_ALARM_CRITICAL
        if value >= crit_max:
            return "critical", settings.COLOR_ALARM_CRITICAL
        elif value >= warn_max or value <= warn_min:
            return "warning", settings.COLOR_ALARM_HIGH
        return "normal", settings.TEXT_PRIMARY

    async def get_formatted_telemetry(self) -> Dict[str, Any]:
        """Return pre-formatted, display-ready telemetry JSON contract."""
        async with self._lock:
            # Core Temp evaluation
            t_status, t_color = self.evaluate_status(
                self.core_temp, settings.NORMAL_TEMP_MIN, settings.NORMAL_TEMP_MAX, settings.CRITICAL_TEMP_TRIP
            )
            # Pressure evaluation
            p_status, p_color = self.evaluate_status(
                self.core_pressure, settings.NORMAL_PRESSURE_MIN, settings.NORMAL_PRESSURE_MAX, settings.CRITICAL_PRESSURE_TRIP
            )
            # RPM evaluation
            rpm_status = "normal" if self.turbine_rpm > 2500 else ("warning" if self.turbine_rpm > 500 else "critical")
            rpm_color = settings.TEXT_PRIMARY if rpm_status == "normal" else settings.COLOR_ALARM_HIGH

            # Determine overall system status
            sys_status = "NORMAL"
            if self.estop_active:
                sys_status = "SCRAM"
            elif self.deception_active:
                sys_status = "DECEPTION_ACTIVE"
            elif t_status == "critical" or p_status == "critical":
                sys_status = "CRITICAL"
            elif t_status == "warning" or p_status == "warning":
                sys_status = "WARNING"

            # Apply sensor jitter for display
            display_temp = self.add_jitter(self.core_temp, 0.1)
            display_press = self.add_jitter(self.core_pressure, 0.02)
            display_rpm = self.add_jitter(self.turbine_rpm, 2.0)
            display_power = self.add_jitter(self.electrical_power, 0.1)

            return {
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "system_status": sys_status,
                "estop_active": self.estop_active,
                "deception_active": self.deception_active,
                "vulnerable_mode": self.vulnerable_mode,
                "reactor": {
                    "fuel_pressure": {
                        "raw": round(self.fuel_pressure, 3),
                        "formatted": f"{self.fuel_pressure:.2f} bar",
                        "status": "normal" if self.fuel_pressure > 0.5 else "scram",
                        "status_color": settings.COLOR_FLOW_CYAN if self.fuel_pressure > 0.5 else settings.COLOR_INACTIVE,
                        "unit": "bar"
                    },
                    "fuel_flow": {
                        "raw": round(self.fuel_flow, 3),
                        "formatted": f"{self.fuel_flow:.2f} L/min",
                        "status": "normal" if self.fuel_flow > 1.0 else "scram",
                        "status_color": settings.COLOR_FLOW_CYAN if self.fuel_flow > 1.0 else settings.COLOR_INACTIVE,
                        "unit": "L/min"
                    },
                    "core_temp": {
                        "raw": round(display_temp, 2),
                        "formatted": f"{display_temp:.1f} °C",
                        "status": t_status,
                        "status_color": t_color,
                        "unit": "°C"
                    },
                    "core_pressure": {
                        "raw": round(display_press, 3),
                        "formatted": f"{display_press:.2f} bar",
                        "status": p_status,
                        "status_color": p_color,
                        "unit": "bar"
                    },
                    "steam_temp": {
                        "raw": round(self.steam_temp, 2),
                        "formatted": f"{self.steam_temp:.1f} °C",
                        "status": t_status,
                        "status_color": t_color,
                        "unit": "°C"
                    },
                    "steam_pressure": {
                        "raw": round(self.steam_pressure, 3),
                        "formatted": f"{self.steam_pressure:.2f} bar",
                        "status": p_status,
                        "status_color": p_color,
                        "unit": "bar"
                    },
                    "turbine_torque": {
                        "raw": round(self.turbine_torque, 1),
                        "formatted": f"{self.turbine_torque:.0f} N·m",
                        "status": "normal" if self.turbine_torque > 100 else "inactive",
                        "status_color": settings.COLOR_FLOW_CYAN if self.turbine_torque > 100 else settings.COLOR_INACTIVE,
                        "unit": "N·m"
                    },
                    "turbine_rpm": {
                        "raw": round(display_rpm, 1),
                        "formatted": f"{display_rpm:.0f} RPM",
                        "status": rpm_status,
                        "status_color": rpm_color,
                        "unit": "RPM"
                    },
                    "generator_output": {
                        "raw": round(self.generator_output, 1),
                        "formatted": f"{self.generator_output:.1f} %",
                        "status": "normal" if self.generator_output > 10 else "scram",
                        "status_color": settings.COLOR_FLOW_CYAN if self.generator_output > 10 else settings.COLOR_INACTIVE,
                        "unit": "%"
                    },
                    "electrical_power": {
                        "raw": round(display_power, 2),
                        "formatted": f"{display_power:.1f} MW",
                        "status": "normal" if display_power > 5.0 else "scram",
                        "status_color": settings.COLOR_FLOW_CYAN if display_power > 5.0 else settings.COLOR_INACTIVE,
                        "unit": "MW"
                    },
                    "coolant_flow": {
                        "raw": round(self.coolant_flow, 2),
                        "formatted": f"{self.coolant_flow:.1f} L/min",
                        "status": "normal" if self.coolant_flow > 5.0 else "warning",
                        "status_color": settings.COLOR_FLOW_CYAN if self.coolant_flow > 5.0 else settings.COLOR_ALARM_HIGH,
                        "unit": "L/min"
                    },
                    "coolant_temp": {
                        "raw": round(self.coolant_temp, 2),
                        "formatted": f"{self.coolant_temp:.1f} °C",
                        "status": "normal",
                        "status_color": settings.TEXT_PRIMARY,
                        "unit": "°C"
                    },
                    "vessel_level": {
                        "raw": round(self.vessel_level, 1),
                        "formatted": f"{self.vessel_level:.1f} %",
                        "status": "normal",
                        "status_color": settings.COLOR_FLOW_CYAN,
                        "unit": "%"
                    }
                },
                "setpoints": {
                    "target_rpm": {"raw": self.setpoints.target_rpm, "formatted": f"{self.setpoints.target_rpm:.0f} RPM"},
                    "target_temp": {"raw": self.setpoints.target_temp, "formatted": f"{self.setpoints.target_temp:.1f} °C"},
                    "target_pressure": {"raw": self.setpoints.target_pressure, "formatted": f"{self.setpoints.target_pressure:.2f} bar"}
                },
                "actuators": {
                    "fuel_valve": {
                        "state": self.fuel_valve,
                        "formatted": "OPEN" if self.fuel_valve else "CLOSED",
                        "modbus_address": "%QX0.0"
                    },
                    "coolant_pump": {
                        "state": self.coolant_pump,
                        "formatted": "RUNNING" if self.coolant_pump else "OFF",
                        "modbus_address": "%QX0.1"
                    },
                    "heater_jacket": {
                        "state": self.heater_jacket,
                        "formatted": "ENGAGED" if self.heater_jacket else "OFF",
                        "modbus_address": "%QX0.2"
                    },
                    "relief_valve": {
                        "state": self.relief_valve,
                        "formatted": "OPEN" if self.relief_valve else "CLOSED",
                        "modbus_address": "%QX0.3"
                    }
                }
            }

reactor_state = ReactorState()
