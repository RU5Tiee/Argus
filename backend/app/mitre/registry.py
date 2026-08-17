from pydantic import BaseModel
from typing import List, Dict

class MitreTechnique(BaseModel):
    id: str
    name: str
    tactic: str
    description: str
    severity: str
    affected_asset: str

MITRE_ICS_TECHNIQUES: Dict[str, MitreTechnique] = {
    "T0888": MitreTechnique(
        id="T0888",
        name="Remote System Information Discovery",
        tactic="Reconnaissance",
        description="Probing OT networks to identify live hosts, protocols, and device models.",
        severity="Low",
        affected_asset="Control Network, EWS, OWS"
    ),
    "T0846": MitreTechnique(
        id="T0846",
        name="Wireless Footprinting",
        tactic="Reconnaissance",
        description="Scanning industrial wireless spectrums (802.15.4, ISA100.11a, WirelessHART).",
        severity="Low",
        affected_asset="Wireless Gateways"
    ),
    "T0801": MitreTechnique(
        id="T0801",
        name="Monitor Process State",
        tactic="Reconnaissance",
        description="Passively sniffing or actively polling registers to map normal process baselines.",
        severity="Medium",
        affected_asset="PLCs, RTUs, HMI"
    ),
    "T0819": MitreTechnique(
        id="T0819",
        name="Exploit Public-Facing Application",
        tactic="Initial Access",
        description="Exploiting vulnerabilities in web-accessible OT portals (e.g., OpenPLC HTTP port 8080).",
        severity="High",
        affected_asset="Web Gateways, Soft-PLCs"
    ),
    "T0823": MitreTechnique(
        id="T0823",
        name="API / Scripting Execution",
        tactic="Execution",
        description="Executing malicious Python, PowerShell, or Bash scripts on control servers.",
        severity="High",
        affected_asset="OWS, EWS"
    ),
    "T0871": MitreTechnique(
        id="T0871",
        name="Execution via Programmed Logic",
        tactic="Execution",
        description="Executing unauthorized IEC 61131-3 logic cycles compiled on the target PLC.",
        severity="Critical",
        affected_asset="PLCs"
    ),
    "T0839": MitreTechnique(
        id="T0839",
        name="Module Firmware",
        tactic="Persistence",
        description="Flashing malicious bootloaders or firmware onto controllers.",
        severity="Critical",
        affected_asset="PLCs, RTUs"
    ),
    "T0889": MitreTechnique(
        id="T0889",
        name="Modify Programmed Logic",
        tactic="Persistence",
        description="Altering Ladder Logic or Structured Text to execute hidden backdoor triggers.",
        severity="Critical",
        affected_asset="PLCs"
    ),
    "T0820": MitreTechnique(
        id="T0820",
        name="Exploit Victim Architecture",
        tactic="Evasion",
        description="Crafting packets that abuse protocol parser quirks to bypass Deep Packet Inspection.",
        severity="High",
        affected_asset="OT Firewalls, IDSs"
    ),
    "T0849": MitreTechnique(
        id="T0849",
        name="Rogue Master / Slave",
        tactic="Evasion",
        description="Spoofing an authorized HMI IP address or PLC node to issue unauthenticated commands.",
        severity="High",
        affected_asset="SCADA Master, PLCs"
    ),
    "T0840": MitreTechnique(
        id="T0840",
        name="Network Service Scanning",
        tactic="Discovery",
        description="Sweeping subnets for exposed industrial ports (TCP 502 Modbus).",
        severity="Medium",
        affected_asset="OT Subnets"
    ),
    "T0802": MitreTechnique(
        id="T0802",
        name="Device Identification",
        tactic="Discovery",
        description="Issuing Modbus FC43 (Read Device Identification) to extract vendor, product, version.",
        severity="Medium",
        affected_asset="PLCs, Gateways"
    ),
    "T0830": MitreTechnique(
        id="T0830",
        name="Man-in-the-Middle (MitM)",
        tactic="Collection",
        description="Conducting ARP poisoning to position between OWS and PLC to inspect/alter traffic.",
        severity="Critical",
        affected_asset="OT Ethernet Switch"
    ),
    "T0885": MitreTechnique(
        id="T0885",
        name="Commonly Used Port",
        tactic="Command & Control",
        description="Encapsulating malicious traffic over standard industrial ports (TCP 502).",
        severity="Medium",
        affected_asset="Perimeter Firewalls"
    ),
    "T0814": MitreTechnique(
        id="T0814",
        name="Denial of Service (DoS)",
        tactic="Inhibit Response Function",
        description="Flooding PLC network interfaces with high-rate polling requests to crash scan cycles.",
        severity="Critical",
        affected_asset="PLCs, NICs"
    ),
    "T0816": MitreTechnique(
        id="T0816",
        name="Alarm Suppression",
        tactic="Inhibit Response Function",
        description="Disabling hardware interlocks or overwriting alarm limits to blind operators.",
        severity="Critical",
        affected_asset="Safety Systems (SIS), HMI"
    ),
    "T0836": MitreTechnique(
        id="T0836",
        name="Modify Parameter",
        tactic="Impair Process Control",
        description="Overwriting process setpoints (e.g., forcing temperature register to 150°C).",
        severity="Critical",
        affected_asset="PLCs, Actuators"
    ),
    "T0855": MitreTechnique(
        id="T0855",
        name="Unauthorized Command Message",
        tactic="Impair Process Control",
        description="Directly issuing Modbus FC05/FC06 write frames to field actuators bypassing logic.",
        severity="Critical",
        affected_asset="PLCs, Field Devices"
    ),
    "T0828": MitreTechnique(
        id="T0828",
        name="Loss of Safety",
        tactic="Impact",
        description="Disabling safety trip mechanisms leading to vessel over-pressurization or thermal runaway.",
        severity="Critical",
        affected_asset="SIS, Physical Plant"
    ),
    "T0832": MitreTechnique(
        id="T0832",
        name="Manipulation of View",
        tactic="Impact",
        description="Spoofing normal sensor telemetry to HMI while physical reactor is being destroyed.",
        severity="Critical",
        affected_asset="OWS, HMI"
    ),
    "T0879": MitreTechnique(
        id="T0879",
        name="Damage to Property",
        tactic="Impact",
        description="Causing permanent physical damage to reactor vessels, pumps, or heating elements.",
        severity="Critical",
        affected_asset="Physical Capital Assets"
    ),
}

def get_technique_by_id(tech_id: str) -> MitreTechnique:
    return MITRE_ICS_TECHNIQUES.get(
        tech_id,
        MitreTechnique(
            id=tech_id,
            name="Unknown ICS Technique",
            tactic="Unknown Tactic",
            description="Unclassified industrial threat vector.",
            severity="Medium",
            affected_asset="Unknown OT Node"
        )
    )
