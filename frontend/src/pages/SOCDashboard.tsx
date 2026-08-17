import React, { useEffect, useState } from "react";
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

export const SOCDashboard: React.FC = () => {
  const { telemetry } = useTelemetry();
  const [events, setEvents] = useState<SecurityEvent[]>([]);

  const fetchSecurityEvents = () => {
    fetch("http://localhost:8000/api/v1/security/events?limit=25")
      .then((res) => res.json())
      .then((data) => {
        if (data.events) {
          setEvents(data.events);
        }
      })
      .catch((err) => console.error("Error loading security events:", err));
  };

  // Poll security events log database every 2 seconds
  useEffect(() => {
    fetchSecurityEvents();
    const interval = setInterval(fetchSecurityEvents, 2000);
    return () => clearInterval(interval);
  }, []);

  const security = telemetry?.security || {
    cusum_score: 0,
    fdi_detected: false,
    last_attacker_ip: "-",
    intercepted_payloads_count: 0,
    active_mitre_techniques: [],
    attack_chain_step: "Reconnaissance",
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
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>OT Security Operations Center (SOC) Feed</h1>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Real-time intrusion detection and active deception logging
        </div>
      </header>

      <main
        className="no-scroll-content"
        style={{
          gridTemplateColumns: "1fr 1.5fr",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* LEFT COLUMN: Threat Intelligence Analytics */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" }}>
          {/* Diagnostic Metrics panel */}
          {/* source: WS /ws/telemetry -> security */}
          <div className="isa-panel" style={{ flexShrink: 0 }}>
            <div className="isa-panel-header">IDS Threat Diagnostics</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Current CUSUM Anomaly Score:</span>
                <span
                  style={{
                    color: telemetry?.system_status === "DECEPTION_ACTIVE" || telemetry?.system_status === "CRITICAL" ? "var(--color-alarm-critical)" : "var(--color-flow-cyan)",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                  }}
                >
                  {security.cusum_score.toFixed(3)} / 1.000
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Active Deception Overwrites:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>
                  {security.intercepted_payloads_count} packets
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Last Attacker Source IP:</span>
                <span style={{ color: "var(--color-alarm-critical)", fontWeight: "bold", fontFamily: "monospace" }}>
                  {security.last_attacker_ip}
                </span>
              </div>
            </div>
          </div>

          {/* Active MITRE Techniques Tracker */}
          <div className="isa-panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="isa-panel-header">Active MITRE ATT&CK ICS Techniques</div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {security.active_mitre_techniques.length > 0 ? (
                security.active_mitre_techniques.map((tid) => (
                  <div
                    key={tid}
                    style={{
                      padding: "8px",
                      backgroundColor: "rgba(255,255,255,0.01)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "3px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: "bold", fontSize: "0.75rem", color: "var(--color-alarm-critical)" }}>
                      {tid}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      Tactic: {security.attack_chain_step}
                    </span>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  No active threat signatures registered in kill chain.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time SQLite WAL Log Feed */}
        {/* source: GET /api/v1/security/events */}
        <div className="isa-panel" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="isa-panel-header">SQLite WAL Security Event Log</div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {events.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", height: "30px" }}>
                    <th style={{ padding: "4px 8px" }}>Time</th>
                    <th style={{ padding: "4px 8px" }}>Event Type</th>
                    <th style={{ padding: "4px 8px" }}>Source IP</th>
                    <th style={{ padding: "4px 8px" }}>Register</th>
                    <th style={{ padding: "4px 8px", textAlign: "right" }}>Injected</th>
                    <th style={{ padding: "4px 8px", textAlign: "right" }}>Overwritten</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", height: "35px" }}>
                      <td style={{ padding: "4px 8px", color: "var(--text-muted)", fontSize: "0.7rem" }}>
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: "4px 8px", fontWeight: "bold", color: "var(--color-alarm-critical)" }}>
                        {e.event_type.replace("FDI_ATTACK_", "")}
                      </td>
                      <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>{e.source_ip}</td>
                      <td style={{ padding: "4px 8px", fontFamily: "monospace", color: "var(--color-flow-cyan)" }}>
                        {e.target_register}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "right", color: "var(--color-alarm-critical)" }}>
                        {e.injected_payload}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "right", color: "var(--color-flow-cyan)" }}>
                        {e.deception_overwritten_value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                }}
              >
                No intrusion alerts logged in security database.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
export default SOCDashboard;
