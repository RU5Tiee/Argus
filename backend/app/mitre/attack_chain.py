from typing import List, Dict, Any
from app.mitre.registry import MITRE_ICS_TECHNIQUES, get_technique_by_id

class AttackChainTracker:
    def __init__(self):
        self.active_techniques: List[str] = ["T0801"] # Baseline process monitoring
        self.current_phase: str = "Reconnaissance"

    def register_threat_event(self, technique_id: str):
        if technique_id in MITRE_ICS_TECHNIQUES and technique_id not in self.active_techniques:
            self.active_techniques.append(technique_id)
            tech = MITRE_ICS_TECHNIQUES[technique_id]
            self.current_phase = tech.tactic

    def get_status(self) -> Dict[str, Any]:
        tech_objects = [get_technique_by_id(tid).dict() for tid in self.active_techniques]
        return {
            "current_phase": self.current_phase,
            "active_technique_ids": self.active_techniques,
            "techniques": tech_objects
        }

attack_chain_tracker = AttackChainTracker()
