import React from "react";
import { useTelemetry } from "../context/TelemetryContext";
import { ProcessFlowAnimator } from "../components/ProcessFlowAnimator";

export const Overview: React.FC = () => {
  const { telemetry } = useTelemetry();

  const activeAlarms = telemetry?.alarms.active_count ?? 0;
  const alarmColor = telemetry?.alarms.highest_severity === "CRITICAL"
    ? "var(--color-alarm-critical)"
    : (telemetry?.alarms.highest_severity === "WARNING" ? "var(--color-alarm-high)" : "var(--text-muted)");

  const reactor = telemetry?.reactor || {
    fuel_pressure: { formatted: "--", status: "normal", status_color: "var(--text-primary)" },
    fuel_flow: { formatted: "--", status: "normal", status_color: "var(--text-primary)" },
    core_temp: { formatted: "--", status: "normal", status_color: "var(--text-primary)", raw: 0 },
    core_pressure: { formatted: "--", status: "normal", status_color: "var(--text-primary)", raw: 0 },
    steam_temp: { formatted: "--", status: "normal", status_color: "var(--text-primary)" },
    steam_pressure: { formatted: "--", status: "normal", status_color: "var(--text-primary)" },
    turbine_torque: { formatted: "--", status: "normal", status_color: "var(--text-primary)" },
    turbine_rpm: { formatted: "--", status: "normal", status_color: "var(--text-primary)", raw: 0 },
    generator_output: { formatted: "--", status: "normal", status_color: "var(--text-primary)" },
    electrical_power: { formatted: "--", status: "normal", status_color: "var(--text-primary)" },
    coolant_flow: { formatted: "--", status: "normal", status_color: "var(--text-primary)" },
    coolant_temp: { formatted: "--", status: "normal", status_color: "var(--text-primary)" },
    vessel_level: { formatted: "--", status: "normal", status_color: "var(--text-primary)", raw: 0 },
  };

  const turbineParams = [
    { label: "Turbine Steam Temp", tag: "TT-201", val: reactor.steam_temp },
    { label: "Turbine Steam Press", tag: "PT-201", val: reactor.steam_pressure },
    { label: "Turbine Speed", tag: "ST-201", val: reactor.turbine_rpm },
    { label: "Turbine Torque", tag: "TQ-01", val: reactor.turbine_torque },
    { label: "Generator Output", tag: "GEN-01", val: reactor.generator_output },
    { label: "Net Power Output", tag: "MW-01", val: reactor.electrical_power },
  ];

  const processParams = [
    { label: "Fuel Loop Pressure", tag: "PT-102", val: reactor.fuel_pressure },
    { label: "Reactant Feed Flow", tag: "FT-101", val: reactor.fuel_flow },
    { label: "Coolant Loop Flow", tag: "FT-201", val: reactor.coolant_flow },
    { label: "Coolant return Temp", tag: "TT-202", val: reactor.coolant_temp },
    { label: "Liquid Level Height", tag: "LT-101", val: reactor.vessel_level },
  ];

  const renderParamRows = (params: typeof turbineParams) => {
    return params.map((p) => (
      <tr key={p.label} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", height: "30px" }}>
        <td style={{ padding: "4px 8px" }}>{p.label}</td>
        <td style={{ padding: "4px 8px", fontFamily: "monospace", color: "var(--text-muted)" }}>{p.tag}</td>
        <td
          style={{
            padding: "4px 8px",
            textAlign: "right",
            fontFamily: "monospace",
            fontWeight: "bold",
            color: p.val.status_color,
          }}
        >
          {p.val.formatted}
        </td>
        <td style={{ padding: "4px 8px", textAlign: "center" }}>
          <span
            style={{
              fontSize: "0.65rem",
              padding: "2px 6px",
              borderRadius: "3px",
              backgroundColor: "rgba(255,255,255,0.02)",
              color: p.val.status_color,
              fontWeight: "bold",
            }}
          >
            {p.val.status.toUpperCase()}
          </span>
        </td>
      </tr>
    ));
  };

  return (
    <div className="no-scroll-container" style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      {/* KPI Tiles row at the top */}
      {/* source: WS /ws/telemetry -> reactor.core_temp, reactor.core_pressure, reactor.turbine_rpm, reactor.electrical_power, alarms.active_count */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "16px",
          flexShrink: 0,
        }}
      >
        {/* Core Temperature Card */}
        <div className="isa-panel" style={{ padding: "12px" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>CORE TEMP (TT-101)</span>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: reactor.core_temp.status_color,
              fontFamily: "monospace",
              marginTop: "4px",
            }}
          >
            {reactor.core_temp.formatted}
          </span>
        </div>

        {/* Vessel Pressure Card */}
        <div className="isa-panel" style={{ padding: "12px" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>VESSEL PRESS (PT-101)</span>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: reactor.core_pressure.status_color,
              fontFamily: "monospace",
              marginTop: "4px",
            }}
          >
            {reactor.core_pressure.formatted}
          </span>
        </div>

        {/* Turbine Speed Card */}
        <div className="isa-panel" style={{ padding: "12px" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>TURBINE SPEED (ST-201)</span>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: reactor.turbine_rpm.status_color,
              fontFamily: "monospace",
              marginTop: "4px",
            }}
          >
            {reactor.turbine_rpm.formatted}
          </span>
        </div>

        {/* Power Output Card */}
        <div className="isa-panel" style={{ padding: "12px" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>ELECTRICAL MW (MW-01)</span>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: reactor.electrical_power.status_color,
              fontFamily: "monospace",
              marginTop: "4px",
            }}
          >
            {reactor.electrical_power.formatted}
          </span>
        </div>

        {/* Active Alarms Count Card */}
        <div className="isa-panel" style={{ padding: "12px" }}>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>ACTIVE ALARMS</span>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: alarmColor,
              fontFamily: "monospace",
              marginTop: "4px",
            }}
          >
            {activeAlarms}
          </span>
        </div>
      </div>

      <main
        className="no-scroll-content"
        style={{
          gridTemplateColumns: "1.3fr 1fr",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Left Hand Side: Live Process Loop Twin */}
        <ProcessFlowAnimator telemetry={telemetry} />

        {/* Right Hand Side: Plant Operations Consolidated Diagnostics */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" }}>
          {/* Parameter Diagnostics panel */}
          {/* source: WS /ws/telemetry -> reactor */}
          <div className="isa-panel" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="isa-panel-header">Consolidated Process Loop Parameters</div>
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--color-flow-cyan)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "block", paddingBottom: "4px", marginBottom: "6px" }}>
                  Turbine Drive System
                </span>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left" }}>
                  <tbody>{renderParamRows(turbineParams)}</tbody>
                </table>
              </div>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--color-flow-cyan)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "block", paddingBottom: "4px", marginBottom: "6px" }}>
                  Reactant & Cooling Loop
                </span>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left" }}>
                  <tbody>{renderParamRows(processParams)}</tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Alarm Banner Panel */}
          {/* source: WS /ws/telemetry -> alarms */}
          <div className="isa-panel" style={{ flexShrink: 0, maxHeight: "110px" }}>
            <div className="isa-panel-header">Active Alarms Summary</div>
            {telemetry && telemetry.alarms.active_count > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                <span style={{ color: "var(--color-alarm-critical)", fontWeight: "bold", fontSize: "0.8rem" }}>
                  {telemetry.alarms.active_count} ACTIVE ALARM(S) DETECTED
                </span>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                  Highest Severity Level:{" "}
                  <span style={{ color: alarmColor, fontWeight: "bold" }}>
                    {telemetry.alarms.highest_severity}
                  </span>
                </p>
              </div>
            ) : (
              <p style={{ fontSize: "0.75rem", color: "var(--color-flow-cyan)", margin: "4px 0 0 0" }}>
                All physical and cybersecurity boundaries normal.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
export default Overview;
