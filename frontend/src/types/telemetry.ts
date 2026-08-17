export interface ValueDisplay {
  raw: number;
  formatted: string;
  status: string; // "normal" | "warning" | "critical" | "scram" | "inactive"
  status_color: string; // Hex color code from ISA-101
  unit: string;
}

export interface ActuatorState {
  state: boolean;
  formatted: string; // "OPEN"/"CLOSED" or "RUNNING"/"OFF" or "ENGAGED"/"OFF"
  modbus_address: string;
}

export interface SetpointDisplay {
  raw: number;
  formatted: string;
}

export interface AlarmItem {
  id: string;
  tag: string;
  name: string;
  priority: number;
  priority_label: string;
  color_hex: string;
  state: string; // "NORMAL" | "UNACK" | "ACK" | "RTN_UNACK" | "SHELVED"
  timestamp: string;
  message: string;
  value_formatted: string;
}

export interface AlarmsSummary {
  active_count: number;
  unack_count: number;
  highest_severity: string;
  list: AlarmItem[];
}

export interface SecuritySummary {
  cusum_score: number;
  fdi_detected: boolean;
  last_attacker_ip: string;
  intercepted_payloads_count: number;
  active_mitre_techniques: string[];
  attack_chain_step: string;
}

export interface TelemetryPayload {
  timestamp: string;
  system_status: string; // "NORMAL" | "WARNING" | "CRITICAL" | "SCRAM" | "DECEPTION_ACTIVE"
  estop_active: boolean;
  deception_active: boolean;
  vulnerable_mode: boolean;
  reactor: {
    fuel_pressure: ValueDisplay;
    fuel_flow: ValueDisplay;
    core_temp: ValueDisplay;
    core_pressure: ValueDisplay;
    steam_temp: ValueDisplay;
    steam_pressure: ValueDisplay;
    turbine_torque: ValueDisplay;
    turbine_rpm: ValueDisplay;
    generator_output: ValueDisplay;
    electrical_power: ValueDisplay;
    coolant_flow: ValueDisplay;
    coolant_temp: ValueDisplay;
    vessel_level: ValueDisplay;
  };
  setpoints: {
    target_rpm: SetpointDisplay;
    target_temp: SetpointDisplay;
    target_pressure: SetpointDisplay;
  };
  actuators: {
    fuel_valve: ActuatorState;
    coolant_pump: ActuatorState;
    heater_jacket: ActuatorState;
    relief_valve: ActuatorState;
  };
  alarms: AlarmsSummary;
  security: SecuritySummary;
}
