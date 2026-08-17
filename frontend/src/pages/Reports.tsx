import React from "react";
import { useTelemetry } from "../context/TelemetryContext";

export const Reports: React.FC = () => {
  const { telemetry } = useTelemetry();

  return (
    <div className="no-scroll-container">
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "12px",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Compliance & Audit Reports</h1>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          ISA-18.2 rationalization metrics and cyber containment reports
        </div>
      </header>

      <main
        className="no-scroll-content"
        style={{
          gridTemplateColumns: "1fr 1fr",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Panel 1: Alarm metrics */}
        <div className="isa-panel" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="isa-panel-header">ISA-18.2 Alarm Metrics summary</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px", fontSize: "0.8rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Average Acknowledgment Latency:</span>
              <span style={{ fontWeight: "bold" }}>14.8 seconds</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Peak Alarm Rate (Flood state):</span>
              <span style={{ fontWeight: "bold", color: "var(--color-alarm-critical)" }}>2 alarms / 10 min</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Top Initiating Tag:</span>
              <span style={{ fontWeight: "bold", color: "var(--color-flow-cyan)" }}>TT-101 (Reactor Temp)</span>
            </div>

            {/* Distribution Graph bar */}
            <div style={{ marginTop: "16px" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block", marginBottom: "6px" }}>
                Alarm Priority Distribution (Target: &lt;5% Critical)
              </span>
              <div style={{ display: "flex", height: "18px", width: "100%", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: "4%", backgroundColor: "var(--color-alarm-critical)" }} title="Critical" />
                <div style={{ width: "16%", backgroundColor: "var(--color-alarm-high)" }} title="High" />
                <div style={{ width: "30%", backgroundColor: "var(--color-alarm-medium)" }} title="Medium" />
                <div style={{ width: "50%", backgroundColor: "var(--color-alarm-low)" }} title="Low" />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px" }}>
                <span>Critical (4%)</span>
                <span>High (16%)</span>
                <span>Medium (30%)</span>
                <span>Low (50%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Threat Summary */}
        <div className="isa-panel" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="isa-panel-header">IDS Cyber Containment Report</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px", fontSize: "0.8rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Total Scenarios Emulated:</span>
              <span style={{ fontWeight: "bold" }}>7 scenarios available</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Total Deception Intercepts:</span>
              <span style={{ fontWeight: "bold", color: "var(--color-flow-cyan)" }}>
                {telemetry?.security.intercepted_payloads_count || 0} writes neutralized
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Safety SCRAM Trip interlocks:</span>
              <span style={{ fontWeight: "bold", color: telemetry?.estop_active ? "var(--color-alarm-critical)" : "var(--color-flow-cyan)" }}>
                {telemetry?.estop_active ? "ENGAGED" : "ARMED"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default Reports;
