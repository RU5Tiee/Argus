import React from "react";
import type { TelemetryPayload } from "../types/telemetry";

interface PLCMemoryViewProps {
  telemetry: TelemetryPayload | null;
}

export const PLCMemoryView: React.FC<PLCMemoryViewProps> = ({ telemetry }) => {
  if (!telemetry) {
    return (
      <div className="isa-panel" style={{ flex: 1 }}>
        <div className="isa-panel-header">PLC Modbus Memory Table</div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Awaiting connection...</p>
      </div>
    );
  }

  const { actuators, reactor } = telemetry;

  const memoryMap = [
    {
      address: "%QX0.0",
      offset: "0x0000",
      type: "COIL (R/W)",
      component: "V-101",
      description: "Inlet Solenoid Valve",
      value: actuators.fuel_valve.formatted,
      active: actuators.fuel_valve.state,
    },
    {
      address: "%QX0.1",
      offset: "0x0001",
      type: "COIL (R/W)",
      component: "M-201",
      description: "Coolant Loop Pump",
      value: actuators.coolant_pump.formatted,
      active: actuators.coolant_pump.state,
    },
    {
      address: "%QX0.2",
      offset: "0x0002",
      type: "COIL (R/W)",
      component: "HTR-101",
      description: "Electric Heater Jacket",
      value: actuators.heater_jacket.formatted,
      active: actuators.heater_jacket.state,
    },
    {
      address: "%QX0.3",
      offset: "0x0003",
      type: "COIL (R/W)",
      component: "RV-101",
      description: "Emergency Relief Valve",
      value: actuators.relief_valve.formatted,
      active: actuators.relief_valve.state,
    },
    {
      address: "%QW0.0",
      offset: "0x0000",
      type: "HOLDING_REG (R/W)",
      component: "TT-101",
      description: "Reactor Core Temperature",
      value: reactor.core_temp.formatted,
      active: reactor.core_temp.status !== "normal",
      status_color: reactor.core_temp.status_color,
    },
    {
      address: "%QW0.1",
      offset: "0x0001",
      type: "HOLDING_REG (R/W)",
      component: "PT-101",
      description: "Vessel Pressure",
      value: reactor.core_pressure.formatted,
      active: reactor.core_pressure.status !== "normal",
      status_color: reactor.core_pressure.status_color,
    },
    {
      address: "%QW0.2",
      offset: "0x0002",
      type: "HOLDING_REG (R/W)",
      component: "FT-101",
      description: "Feed flow rate",
      value: reactor.fuel_flow.formatted,
      active: false,
    },
    {
      address: "%QW0.3",
      offset: "0x0003",
      type: "HOLDING_REG (R/W)",
      component: "LT-101",
      description: "Liquid level",
      value: reactor.vessel_level.formatted,
      active: false,
    },
  ];

  return (
    <div className="isa-panel" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="isa-panel-header">PLC Modbus Data Registers (%QX / %QW)</div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.75rem",
            color: "var(--text-primary)",
            textAlign: "left",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", height: "30px" }}>
              <th style={{ padding: "4px 8px" }}>IEC Address</th>
              <th style={{ padding: "4px 8px" }}>Modbus Offset</th>
              <th style={{ padding: "4px 8px" }}>Register Type</th>
              <th style={{ padding: "4px 8px" }}>Component</th>
              <th style={{ padding: "4px 8px" }}>Description</th>
              <th style={{ padding: "4px 8px", textAlign: "right" }}>Raw/Scaled Value</th>
            </tr>
          </thead>
          <tbody>
            {memoryMap.map((reg) => (
              <tr
                key={reg.address}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.02)",
                  height: "35px",
                  backgroundColor: reg.active ? "rgba(239, 68, 68, 0.03)" : "transparent",
                }}
              >
                <td style={{ padding: "4px 8px", fontFamily: "monospace", color: "var(--color-flow-cyan)" }}>
                  {reg.address}
                </td>
                <td style={{ padding: "4px 8px", fontFamily: "monospace", color: "var(--text-muted)" }}>
                  {reg.offset}
                </td>
                <td style={{ padding: "4px 8px", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {reg.type}
                </td>
                <td style={{ padding: "4px 8px", fontWeight: "bold" }}>
                  {reg.component}
                </td>
                <td style={{ padding: "4px 8px", color: "var(--text-muted)" }}>
                  {reg.description}
                </td>
                <td
                  style={{
                    padding: "4px 8px",
                    textAlign: "right",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    color: reg.status_color || (reg.active ? "var(--color-flow-cyan)" : "var(--text-primary)"),
                  }}
                >
                  {reg.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default PLCMemoryView;
