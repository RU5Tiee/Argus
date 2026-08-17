import React, { useState, useEffect } from "react";
import { useTelemetry } from "../context/TelemetryContext";

interface SecurityEvent {
  id: number;
  timestamp: string;
  event_type: string;
  source_ip: string;
  target_register: string;
  function_code: number;
  injected_payload: number;
  deception_overwritten_value: number;
  mitre_technique_id: string;
  mitre_technique_name: string;
  attack_chain_phase: string;
  details: string;
}

export const Historian: React.FC = () => {
  const { telemetry } = useTelemetry();
  const [tempHistory, setTempHistory] = useState<number[]>([]);
  const [pressHistory, setPressHistory] = useState<number[]>([]);
  const [rpmHistory, setRpmHistory] = useState<number[]>([]);

  // Paginated query state
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [limit] = useState(10);
  const [offset, setOffset] = useState(0);

  // Collect historical points in local state for live trend visualization
  useEffect(() => {
    if (telemetry) {
      setTempHistory((prev) => [...prev.slice(-29), telemetry.reactor.core_temp.raw]);
      setPressHistory((prev) => [...prev.slice(-29), telemetry.reactor.core_pressure.raw]);
      setRpmHistory((prev) => [...prev.slice(-29), telemetry.reactor.turbine_rpm.raw]);
    }
  }, [telemetry]);

  // Query paginated log endpoint
  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/security/events?limit=${limit}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.events) {
          setEvents(data.events);
        }
      })
      .catch((err) => console.error("Error loading security events:", err));
  }, [limit, offset]);

  const renderTrendLine = (data: number[], min: number, max: number, strokeColor: string) => {
    if (data.length < 2) return null;
    const width = 300;
    const height = 100;
    const padding = 10;
    
    const points = data
      .map((val, idx) => {
        const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
        const ratio = (val - min) / (max - min || 1);
        const y = height - padding - ratio * (height - 2 * padding);
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width="100%" height="100" style={{ backgroundColor: "#060911", borderRadius: "3px", border: "1px solid var(--border-color)" }}>
        <polyline fill="none" stroke={strokeColor} strokeWidth="2" points={points} />
      </svg>
    );
  };

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
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>SCADA Data Historian Trend Logs</h1>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Real-time timeseries loop diagnostic charts and databases
        </div>
      </header>

      <main
        className="no-scroll-content"
        style={{
          gridTemplateRows: "1.2fr 1fr",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Top: Trend Charts Row */}
        {/* source: WS /ws/telemetry -> reactor.core_temp, reactor.core_pressure, reactor.turbine_rpm */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", overflow: "hidden" }}>
          {/* Core Temp Trend */}
          <div className="isa-panel">
            <div className="isa-panel-header">Core Temp (TT-101) Trend Line</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", justifyContent: "center" }}>
              {renderTrendLine(tempHistory, 20, 150, "var(--color-alarm-critical)")}
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>Scale: 20°C - 150°C</span>
                <span>Points: {tempHistory.length} / 30</span>
              </div>
            </div>
          </div>

          {/* Vessel Pressure Trend */}
          <div className="isa-panel">
            <div className="isa-panel-header">Core Pressure (PT-101) Trend Line</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", justifyContent: "center" }}>
              {renderTrendLine(pressHistory, 1.0, 8.0, "var(--color-flow-cyan)")}
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>Scale: 1.0 bar - 8.0 bar</span>
                <span>Points: {pressHistory.length} / 30</span>
              </div>
            </div>
          </div>

          {/* Turbine RPM Trend */}
          <div className="isa-panel">
            <div className="isa-panel-header">Turbine Rotation Speed (ST-201) Trend Line</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", justifyContent: "center" }}>
              {renderTrendLine(rpmHistory, 0, 4000, "var(--color-flow-cyan)")}
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                <span>Scale: 0 RPM - 4000 RPM</span>
                <span>Points: {rpmHistory.length} / 30</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Queryable database table */}
        {/* source: GET /api/v1/security/events */}
        <div className="isa-panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div className="isa-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Security Threat Logs Database Queries</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                disabled={offset === 0}
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "0.7rem",
                }}
              >
                PREV
              </button>
              <button
                onClick={() => setOffset((prev) => prev + limit)}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "0.7rem",
                }}
              >
                NEXT
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", height: "30px" }}>
                  <th style={{ padding: "4px 8px" }}>Event ID</th>
                  <th style={{ padding: "4px 8px" }}>Timestamp</th>
                  <th style={{ padding: "4px 8px" }}>Threat Type</th>
                  <th style={{ padding: "4px 8px" }}>Source IP</th>
                  <th style={{ padding: "4px 8px" }}>Register</th>
                  <th style={{ padding: "4px 8px", textAlign: "right" }}>Injected Payload</th>
                  <th style={{ padding: "4px 8px", textAlign: "right" }}>Overwritten Decoy</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(offset, offset + limit).map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", height: "35px" }}>
                    <td style={{ padding: "4px 8px", fontFamily: "monospace", color: "var(--text-muted)" }}>{e.id}</td>
                    <td style={{ padding: "4px 8px", color: "var(--text-muted)" }}>{new Date(e.timestamp).toLocaleString()}</td>
                    <td style={{ padding: "4px 8px", fontWeight: "bold", color: "var(--color-alarm-critical)" }}>{e.event_type}</td>
                    <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{e.source_ip}</td>
                    <td style={{ padding: "4px 8px", fontFamily: "monospace", color: "var(--color-flow-cyan)" }}>{e.target_register}</td>
                    <td style={{ padding: "4px 8px", textAlign: "right", color: "var(--color-alarm-critical)", fontFamily: "monospace" }}>{e.injected_payload}</td>
                    <td style={{ padding: "4px 8px", textAlign: "right", color: "var(--color-flow-cyan)", fontFamily: "monospace" }}>{e.deception_overwritten_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
export default Historian;
