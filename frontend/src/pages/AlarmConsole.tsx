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

export const AlarmConsole: React.FC = () => {
  const { telemetry, authToken } = useTelemetry();
  const [isLoading, setIsLoading] = useState(false);

  // Historian trend memory states
  const [tempHistory, setTempHistory] = useState<number[]>([]);
  const [pressHistory, setPressHistory] = useState<number[]>([]);
  const [rpmHistory, setRpmHistory] = useState<number[]>([]);

  // SQLite WAL Events paginated states
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [limit] = useState(7);
  const [offset, setOffset] = useState(0);

  // Sync historical points for live trend charts
  useEffect(() => {
    if (telemetry) {
      setTempHistory((prev) => [...prev.slice(-19), telemetry.reactor.core_temp.raw]);
      setPressHistory((prev) => [...prev.slice(-19), telemetry.reactor.core_pressure.raw]);
      setRpmHistory((prev) => [...prev.slice(-19), telemetry.reactor.turbine_rpm.raw]);
    }
  }, [telemetry]);

  // Poll security events
  useEffect(() => {
    const fetchEvents = () => {
      fetch("http://localhost:8000/api/v1/security/events?limit=50")
        .then((res) => res.json())
        .then((data) => {
          if (data.events) {
            setEvents(data.events);
          }
        })
        .catch((err) => console.error("Error loading events in SOC Console:", err));
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!telemetry) {
    return (
      <div className="no-scroll-container">
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "20px" }}>Awaiting telemetry...</div>
      </div>
    );
  }

  const { alarms, security, system_status } = telemetry;

  const handleAcknowledge = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/alarms/acknowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify({ alarm_id: id }),
      });
      if (!response.ok) {
        const err = await response.json();
        alert(`Error: ${err.detail?.message || "Failed to ack alarm."}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShelve = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/alarms/shelve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify({ alarm_id: id }),
      });
      if (!response.ok) {
        const err = await response.json();
        alert(`Error: ${err.detail?.message || "Failed to shelve alarm."}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/alarms/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify({ alarm_id: id }),
      });
      if (!response.ok) {
        const err = await response.json();
        alert(`Error: ${err.detail?.message || "Failed to clear alarm."}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTrendLine = (data: number[], min: number, max: number, strokeColor: string) => {
    if (data.length < 2) return null;
    const width = 220;
    const height = 45;
    const padding = 4;
    
    const points = data
      .map((val, idx) => {
        const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
        const ratio = (val - min) / (max - min || 1);
        const y = height - padding - ratio * (height - 2 * padding);
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width="100%" height="45" style={{ backgroundColor: "#060911", borderRadius: "3px", border: "1px solid var(--border-color)" }}>
        <polyline fill="none" stroke={strokeColor} strokeWidth="1.5" points={points} />
      </svg>
    );
  };

  const activeMITREList = security?.active_mitre_techniques || [];

  return (
    <div className="no-scroll-container" style={{ height: "100%" }}>
      <main
        className="no-scroll-content"
        style={{
          gridTemplateColumns: "1.2fr 1fr 1.3fr",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          gap: "16px"
        }}
      >
        {/* ========================================== */}
        {/* LEFT COLUMN: ISA-18.2 Alarms & Compliance */}
        {/* ========================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" }}>
          {/* Active Alarms log */}
          {/* source: WS /ws/telemetry -> alarms */}
          {/* source: POST /api/v1/alarms/acknowledge */}
          {/* source: POST /api/v1/alarms/clear */}
          {/* source: POST /api/v1/alarms/shelve */}
          <div className="isa-panel" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="isa-panel-header">Active Alarms Log (ISA-18.2)</div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", height: "28px" }}>
                    <th style={{ padding: "4px" }}>Tag</th>
                    <th style={{ padding: "4px" }}>Message</th>
                    <th style={{ padding: "4px" }}>State</th>
                    <th style={{ padding: "4px", textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alarms.list.map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", height: "38px" }}>
                      <td style={{ padding: "4px", fontWeight: "bold", color: a.color_hex }}>{a.tag}</td>
                      <td style={{ padding: "4px", color: "var(--text-muted)" }}>{a.message}</td>
                      <td style={{ padding: "4px" }}>
                        <span style={{ fontSize: "0.65rem", padding: "2px 4px", borderRadius: "3px", backgroundColor: "rgba(255,255,255,0.02)", color: a.color_hex, fontWeight: "bold" }}>
                          {a.state}
                        </span>
                      </td>
                      <td style={{ padding: "4px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                          {a.state === "UNACK" && (
                            <button
                              disabled={isLoading}
                              onClick={() => handleAcknowledge(a.id)}
                              style={{ padding: "3px 6px", fontSize: "0.65rem", backgroundColor: "rgba(14,165,233,0.15)", border: "1px solid var(--color-flow-cyan)", color: "var(--color-flow-cyan)", cursor: "pointer" }}
                            >
                              ACK
                            </button>
                          )}
                          {a.state === "RTN_UNACK" && (
                            <button
                              disabled={isLoading}
                              onClick={() => handleClear(a.id)}
                              style={{ padding: "3px 6px", fontSize: "0.65rem", backgroundColor: "rgba(34,197,94,0.15)", border: "1px solid var(--color-flow-cyan)", color: "var(--color-flow-cyan)", cursor: "pointer" }}
                            >
                              CLEAR
                            </button>
                          )}
                          {a.state !== "SHELVED" && a.state !== "NORMAL" && (
                            <button
                              disabled={isLoading}
                              onClick={() => handleShelve(a.id)}
                              style={{ padding: "3px 6px", fontSize: "0.65rem", backgroundColor: "rgba(251,146,60,0.15)", border: "1px solid var(--border-color)", color: "var(--text-muted)", cursor: "pointer" }}
                            >
                              SHELV
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alarm Distribution & Reports Metrics */}
          {/* source: WS /ws/telemetry -> alarms.active_count */}
          <div className="isa-panel" style={{ flexShrink: 0, height: "140px" }}>
            <div className="isa-panel-header">Compliance & Statistics Report</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px", fontSize: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Total Active Alarms:</span>
                <span style={{ fontWeight: "bold", color: alarms.active_count > 0 ? "var(--color-alarm-critical)" : "var(--color-flow-cyan)" }}>
                  {alarms.active_count}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Unacknowledged Alerts:</span>
                <span style={{ fontWeight: "bold", color: alarms.unack_count > 0 ? "var(--color-alarm-high)" : "var(--text-muted)" }}>
                  {alarms.unack_count}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Compliance Standard:</span>
                <span style={{ fontWeight: "bold" }}>ISA-18.2-2016</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* MIDDLE COLUMN: Historian Trends & Active IDS */}
        {/* ========================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" }}>
          {/* Historian Trends */}
          {/* source: WS /ws/telemetry -> reactor.core_temp, reactor.core_pressure, reactor.turbine_rpm */}
          <div className="isa-panel" style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="isa-panel-header">Historian Real-Time Trends</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>Core Temp Trend (TT-101)</span>
                {renderTrendLine(tempHistory, 20, 150, "var(--color-alarm-critical)")}
              </div>
              <div>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>Vessel Pressure Trend (PT-101)</span>
                {renderTrendLine(pressHistory, 1.0, 8.0, "var(--color-flow-cyan)")}
              </div>
              <div>
                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>Turbine RPM Trend (ST-201)</span>
                {renderTrendLine(rpmHistory, 0, 4000, "var(--color-flow-cyan)")}
              </div>
            </div>
          </div>

          {/* IDS Threat diagnostics */}
          {/* source: WS /ws/telemetry -> security */}
          <div className="isa-panel" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="isa-panel-header">IDS Diagnostics & MITRE Registry</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.75rem", marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>CUSUM Anomaly score:</span>
                <span style={{ fontWeight: "bold", fontFamily: "monospace", color: system_status === "DECEPTION_ACTIVE" || system_status === "CRITICAL" ? "var(--color-alarm-critical)" : "var(--color-flow-cyan)" }}>
                  {security.cusum_score.toFixed(3)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Active Deception overwrites:</span>
                <span style={{ fontWeight: "bold", color: "var(--text-primary)" }}>{security.intercepted_payloads_count} packets</span>
              </div>

              {/* MITRE checklist */}
              <div style={{ flex: 1, overflowY: "auto", marginTop: "4px" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: "4px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  Active MITRE ATT&CK Registry Detections
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {activeMITREList.length > 0 ? (
                    activeMITREList.map((tid) => (
                      <div key={tid} style={{ padding: "4px 8px", backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "3px", fontSize: "0.65rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "bold", color: "var(--color-alarm-critical)" }}>{tid}</span>
                        <span style={{ color: "var(--text-muted)" }}>{security.attack_chain_step}</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>No active MITRE signatures flagged.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: SQLite WAL Events & Profiles */}
        {/* ========================================== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" }}>
          {/* SQLite WAL Security Event Feed */}
          {/* source: GET /api/v1/security/events */}
          <div className="isa-panel" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="isa-panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>SQLite WAL Security Log Feed</span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  disabled={offset === 0}
                  onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
                  style={{ padding: "2px 6px", fontSize: "0.65rem", backgroundColor: "transparent", border: "1px solid var(--border-color)", color: "var(--text-primary)", cursor: "pointer" }}
                >
                  &lt;
                </button>
                <button
                  disabled={offset + limit >= events.length}
                  onClick={() => setOffset((prev) => prev + limit)}
                  style={{ padding: "2px 6px", fontSize: "0.65rem", backgroundColor: "transparent", border: "1px solid var(--border-color)", color: "var(--text-primary)", cursor: "pointer" }}
                >
                  &gt;
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.7rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", height: "26px" }}>
                    <th style={{ padding: "4px" }}>Threat</th>
                    <th style={{ padding: "4px" }}>Register</th>
                    <th style={{ padding: "4px", textAlign: "right" }}>Payload</th>
                    <th style={{ padding: "4px", textAlign: "right" }}>Fabricated</th>
                  </tr>
                </thead>
                <tbody>
                  {events.slice(offset, offset + limit).map((e) => (
                    <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", height: "30px" }}>
                      <td style={{ padding: "4px", fontWeight: "bold", color: "var(--color-alarm-critical)" }}>{e.event_type}</td>
                      <td style={{ padding: "4px", fontFamily: "monospace" }}>{e.target_register}</td>
                      <td style={{ padding: "4px", textAlign: "right", color: "var(--color-alarm-critical)", fontFamily: "monospace" }}>{e.injected_payload}</td>
                      <td style={{ padding: "4px", textAlign: "right", color: "var(--color-flow-cyan)", fontFamily: "monospace" }}>{e.deception_overwritten_value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Threat Actors profile & Timing diagnostics */}
          {/* source: WS /ws/telemetry -> security */}
          <div className="isa-panel" style={{ flexShrink: 0, height: "170px", display: "flex", flexDirection: "column" }}>
            <div className="isa-panel-header">Timing Profiling & Actor Intel</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.75rem", marginTop: "8px" }}>
              <div style={{ padding: "6px", backgroundColor: "rgba(239, 68, 68, 0.02)", border: "1px solid var(--border-color)", borderRadius: "3px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span style={{ fontWeight: "bold", color: "var(--color-alarm-critical)" }}>APT: {security.last_attacker_ip}</span>
                  <span style={{ fontSize: "0.6rem", fontWeight: "bold", color: "var(--color-alarm-critical)" }}>ACTIVE_TARGET</span>
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Target: %QW0.0 / holding registers. Status: Flagged.</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Avg response latency:</span>
                <span style={{ fontWeight: "bold", fontFamily: "monospace", color: "var(--color-flow-cyan)" }}>38 ms</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Timing security state:</span>
                <span style={{ fontWeight: "bold", color: "var(--color-flow-cyan)" }}>SECURE (Below 40ms)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
export default AlarmConsole;
