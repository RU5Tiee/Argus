import asyncio
import logging
import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.physics.state import reactor_state
from app.alarms.engine import alarm_engine
from app.ids.deception import deception_router
from app.ids.cusum import cusum_detector
from app.mitre.registry import get_technique_by_id
from app.mitre.attack_chain import attack_chain_tracker

logger = logging.getLogger("argus.mitre.simulator")

class AttackStep(BaseModel):
    step_number: int
    timestamp: str
    phase: str
    title: str
    technique_id: str
    technique_name: str
    origin_node: str
    target_node: str
    code_snippet: str
    status: str
    status_color: str
    animation_cue: Dict[str, Any]
    target_register: Optional[str] = None
    payload_value: Optional[str] = None
    physical_impact: Optional[str] = None
    mitigation_result: Optional[str] = None

class AttackScenarioState(BaseModel):
    scenario_id: str
    scenario_name: str
    description: str
    target_mitre_id: str
    is_running: bool
    current_step_index: int
    total_steps: int
    timeline: List[AttackStep]

class AttackSimulator:
    def __init__(self):
        self.active_scenario: Optional[AttackScenarioState] = None
        self._simulation_task: Optional[asyncio.Task] = None

    def get_available_scenarios(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "recon",
                "name": "Scenario 1: Modbus Reconnaissance & Discovery",
                "mitre_id": "T0888",
                "description": "Nmap Modbus discovery scan probing unit IDs and FC43 device identification.",
                "severity": "Low",
                "target": "Port 502 / OpenPLC"
            },
            {
                "id": "fdi_injection",
                "name": "Scenario 2: Aggressive False Data Injection (Sudden Jump)",
                "mitre_id": "T0836",
                "description": "Attacker script forces temperature register %QW0.0 to 150°C. Intercepted by PB-IDS microsecond active deception.",
                "severity": "Critical",
                "target": "%QW0.0 (TT-101)"
            },
            {
                "id": "dos_flood",
                "name": "Scenario 3: Modbus TCP Request DoS Flood",
                "mitre_id": "T0814",
                "description": "High-rate FC03 polling saturating PLC scan cycles and causing OWS telemetry delays.",
                "severity": "Critical",
                "target": "PLC Network Interface"
            },
            {
                "id": "arp_spoof",
                "name": "Scenario 4: Man-in-the-Middle (MitM) ARP Cache Poisoning",
                "mitre_id": "T0830",
                "description": "Attacker positions between OWS and PLC to inspect and tamper with Modbus traffic.",
                "severity": "Critical",
                "target": "Level 2 Ethernet Switch"
            },
            {
                "id": "firmware_injection",
                "name": "Scenario 5: Malicious PLC Module Firmware Upload",
                "mitre_id": "T0839",
                "description": "Uploading unauthorized firmware binary via diagnostic protocol to establish persistent rootkit.",
                "severity": "Critical",
                "target": "PLC Firmware / Memory"
            },
            {
                "id": "tank_overflow",
                "name": "Scenario 6: Actuator Manipulation Tank Overflow Attack",
                "mitre_id": "T0831",
                "description": "Bypasses safety interlocks, locks inlet valve OPEN and closes outlet valve to force physical overfill.",
                "severity": "High",
                "target": "V-101 / V-102"
            },
            {
                "id": "thermal_runaway",
                "name": "Scenario 7: Thermal Runaway & Safety Interlock Bypass",
                "mitre_id": "T0828",
                "description": "Disables safety trip limits, drives heater to 100% capacity to induce destructive boiling.",
                "severity": "Critical",
                "target": "HTR-101 / Core"
            }
        ]

    async def start_scenario(self, scenario_id: str, attacker_ip: str = "192.168.1.105") -> AttackScenarioState:
        if self._simulation_task and not self._simulation_task.done():
            self._simulation_task.cancel()

        timeline = self._build_scenario_timeline(scenario_id, attacker_ip)
        scenario_info = next((s for s in self.get_available_scenarios() if s["id"] == scenario_id), None)
        
        if not scenario_info:
            raise ValueError(f"Unknown scenario ID: {scenario_id}")

        self.active_scenario = AttackScenarioState(
            scenario_id=scenario_id,
            scenario_name=scenario_info["name"],
            description=scenario_info["description"],
            target_mitre_id=scenario_info["mitre_id"],
            is_running=True,
            current_step_index=0,
            total_steps=len(timeline),
            timeline=timeline
        )

        self._simulation_task = asyncio.create_task(self._run_scenario_loop())
        logger.info(f"Started Attack Simulation Scenario '{scenario_id}' from IP {attacker_ip}.")
        return self.active_scenario

    async def stop_scenario(self):
        if self._simulation_task:
            self._simulation_task.cancel()
        if self.active_scenario:
            self.active_scenario.is_running = False
        logger.info("Stopped active attack simulation scenario.")

    async def _run_scenario_loop(self):
        try:
            scenario = self.active_scenario
            for i, step in enumerate(scenario.timeline):
                scenario.current_step_index = i
                step.timestamp = datetime.datetime.utcnow().isoformat() + "Z"
                
                attack_chain_tracker.register_threat_event(step.technique_id)

                if scenario.scenario_id == "fdi_injection" and i == 1:
                    # Let's perform the actual write. If vulnerable_mode is enabled, the physical temp rises.
                    await deception_router.process_incoming_write(
                        register_address="%QW0.0",
                        function_code=6,
                        injected_value=150.0,
                        source_ip=deception_router.last_attacker_ip
                    )
                elif scenario.scenario_id == "thermal_runaway" and i == 1:
                    async with reactor_state._lock:
                        if reactor_state.vulnerable_mode:
                            reactor_state.heater_jacket = True
                            reactor_state.coolant_pump = False
                            reactor_state.core_temp = 145.0
                            reactor_state.estop_active = True # Force SCRAM trip due to overtemp
                        else:
                            # Mitigated: system ignores bypass write
                            pass
                elif scenario.scenario_id == "tank_overflow" and i == 1:
                    async with reactor_state._lock:
                        if reactor_state.vulnerable_mode:
                            reactor_state.fuel_valve = True
                            reactor_state.relief_valve = False
                            reactor_state.vessel_level = 98.0
                            reactor_state.core_pressure = 7.5
                            reactor_state.estop_active = True # Force SCRAM due to level/pressure
                        else:
                            # Mitigated
                            pass

                await asyncio.sleep(2.5)

            # We DO NOT automatically stop the scenario or reset uvicorn telemetry state so it persists!
            scenario.is_running = False
        except asyncio.CancelledError:
            if self.active_scenario:
                self.active_scenario.is_running = False

    def _build_scenario_timeline(self, scenario_id: str, attacker_ip: str) -> List[AttackStep]:
        ts = lambda: datetime.datetime.utcnow().isoformat() + "Z"
        plc_ip = "172.18.0.5:502"

        if scenario_id == "recon":
            return [
                AttackStep(
                    step_number=1,
                    timestamp=ts(),
                    phase="Reconnaissance",
                    title="Nmap Modbus Port Probe",
                    technique_id="T0888",
                    technique_name="Remote System Information Discovery",
                    origin_node=f"RED_TEAM ({attacker_ip})",
                    target_node=f"OPENPLC ({plc_ip})",
                    code_snippet=f"nmap -sV -p 502 --script modbus-discover {plc_ip}",
                    status="EXECUTING",
                    status_color="#0EA5E9",
                    animation_cue={"flow": "RED_TEAM->PLC", "type": "PING_SWEEP", "color": "#0EA5E9"},
                    target_register="Port 502",
                    payload_value="SYN Probe",
                    physical_impact="No physical impact",
                    mitigation_result="Logged & cataloged by security filters"
                ),
                AttackStep(
                    step_number=2,
                    timestamp=ts(),
                    phase="Discovery",
                    title="Modbus Register Enumeration",
                    technique_id="T0801",
                    technique_name="Monitor Process State",
                    origin_node=f"RED_TEAM ({attacker_ip})",
                    target_node=f"OPENPLC ({plc_ip})",
                    code_snippet="modbus_client.read_holding_registers(0, 15)",
                    status="COMPLETED",
                    status_color="#0EA5E9",
                    animation_cue={"flow": "RED_TEAM->PLC", "type": "DATA_POLL", "color": "#0EA5E9"},
                    target_register="Holding Registers 40001 - 40015",
                    payload_value="Function Code 3 Read",
                    physical_impact="Probing tag addresses",
                    mitigation_result="Scan detected by physics-based heuristic"
                )
            ]
        elif scenario_id == "fdi_injection":
            return [
                AttackStep(
                    step_number=1,
                    timestamp=ts(),
                    phase="Execution",
                    title="Exploit Script Execution",
                    technique_id="T0823",
                    technique_name="Scripting Execution",
                    origin_node=f"RED_TEAM ({attacker_ip})",
                    target_node=f"OPENPLC ({plc_ip})",
                    code_snippet="python connector.py --target 172.18.0.5 --write-reg 0 --value 150",
                    status="EXECUTING",
                    status_color="#F97316",
                    animation_cue={"flow": "RED_TEAM->PLC", "type": "PAYLOAD_INJECT", "color": "#F97316"},
                    target_register="%QW0.0 (Core Temp)",
                    payload_value="150.0 °C",
                    physical_impact="Thermal Runaway",
                    mitigation_result="Pending active deception evaluation"
                ),
                AttackStep(
                    step_number=2,
                    timestamp=ts(),
                    phase="Impair Process Control",
                    title="FC06 Lethal Setpoint Injection (150°C)",
                    technique_id="T0836",
                    technique_name="Modify Parameter",
                    origin_node=f"RED_TEAM ({attacker_ip})",
                    target_node=f"OPENPLC (%QW0.0)",
                    code_snippet="client.write_single_register(0, 1500) # 150.0°C",
                    status="COMPLETED",
                    status_color="#EF4444",
                    animation_cue={"flow": "RED_TEAM->PLC", "type": "ATTACK_BURST", "color": "#EF4444"},
                    target_register="%QW0.0 (Core Temp)",
                    payload_value="150.0 °C",
                    physical_impact="Thermal Runaway (Core temp rises to 150.0°C & triggers safety SCRAM)",
                    mitigation_result="VULNERABLE: Direct overwrite successful / PROTECTED: Intercepted & overwritten with safe values (<40ms)"
                )
            ]
        elif scenario_id == "dos_flood":
            return [
                AttackStep(
                    step_number=1,
                    timestamp=ts(),
                    phase="Evasion",
                    title="Modbus TCP Request DoS Flood",
                    technique_id="T0814",
                    technique_name="Denial of Service",
                    origin_node=f"RED_TEAM ({attacker_ip})",
                    target_node="PLC Network Interface",
                    code_snippet="hping3 --flood --udp -p 502 172.18.0.5",
                    status="COMPLETED",
                    status_color="#EF4444",
                    animation_cue={"flow": "RED_TEAM->PLC", "type": "ATTACK_BURST", "color": "#EF4444"},
                    target_register="Ethernet buffer",
                    payload_value="10,000 pkts/sec",
                    physical_impact="Telemetry delays / HMI sync lags",
                    mitigation_result="Rate limiting filters dropped attack packets"
                )
            ]
        elif scenario_id == "tank_overflow":
            return [
                AttackStep(
                    step_number=1,
                    timestamp=ts(),
                    phase="Impair Process Control",
                    title="Actuator Override: Valve Forced Open",
                    technique_id="T0831",
                    technique_name="Manipulation of Control",
                    origin_node=f"RED_TEAM ({attacker_ip})",
                    target_node="OPENPLC (%QX0.0)",
                    code_snippet="client.write_coil(0, True) # Force Open V-101",
                    status="COMPLETED",
                    status_color="#F97316",
                    animation_cue={"flow": "RED_TEAM->PLC", "type": "PAYLOAD_INJECT", "color": "#F97316"},
                    target_register="%QX0.0 (Fuel Inlet Valve)",
                    payload_value="OPEN",
                    physical_impact="Forced liquid flow to vessel, level rises towards 100%",
                    mitigation_result="VULNERABLE: Safety interlock bypassed, causing high-pressure trip / PROTECTED: Override blocked by IDS"
                )
            ]
        elif scenario_id == "thermal_runaway":
            return [
                AttackStep(
                    step_number=1,
                    timestamp=ts(),
                    phase="Inhibit Response Function",
                    title="Interlock Bypass: Disable Coolant Pump & Force Heater",
                    technique_id="T0828",
                    technique_name="Inhibit Response Function",
                    origin_node=f"RED_TEAM ({attacker_ip})",
                    target_node="OPENPLC (%QX0.1 & %QX0.2)",
                    code_snippet="client.write_coils(1, [False, True]) # Stop Pump, Start Heater",
                    status="COMPLETED",
                    status_color="#EF4444",
                    animation_cue={"flow": "RED_TEAM->PLC", "type": "ATTACK_BURST", "color": "#EF4444"},
                    target_register="%QX0.1 (Pump) & %QX0.2 (Heater)",
                    payload_value="Pump: OFF, Heater: ON",
                    physical_impact="Rapid core temperature accumulation to critical SCRAM levels",
                    mitigation_result="VULNERABLE: Direct trip induced / PROTECTED: Blocked by active physical safety checks"
                )
            ]
        else:
            return [
                AttackStep(
                    step_number=1,
                    timestamp=ts(),
                    phase="Execution",
                    title=f"Initiating {scenario_id} payload",
                    technique_id="T0836",
                    technique_name="Modify Parameter",
                    origin_node=f"RED_TEAM ({attacker_ip})",
                    target_node=f"OPENPLC ({plc_ip})",
                    code_snippet=f"python attack_sim.py --scenario {scenario_id}",
                    status="EXECUTING",
                    status_color="#EF4444",
                    animation_cue={"flow": "RED_TEAM->PLC", "type": "ATTACK_BURST", "color": "#EF4444"},
                    target_register="Varies",
                    payload_value="Simulated exploit",
                    physical_impact="Kinetic process impact",
                    mitigation_result="Allowed to propagate in Vulnerable / Mitigated in Protected"
                )
            ]

attack_simulator = AttackSimulator()
