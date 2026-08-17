import React, { useEffect, useState } from "react";
import { useTelemetry } from "../context/TelemetryContext";

interface UserProfile {
  username: string;
  role: string;
  name: string;
  permissions: {
    role: string;
    can_toggle_actuators: boolean;
    can_change_setpoints: boolean;
  };
}

export const Settings: React.FC = () => {
  const { status, authToken } = useTelemetry();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // source: GET /api/v1/auth/me
    if (authToken) {
      fetch("http://localhost:8000/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setProfile(data))
        .catch((err) => console.error("Error loading user profile:", err));
    }
  }, [authToken]);

  const isAdmin = profile?.role === "ADMINISTRATOR";

  return (
    <div className="no-scroll-container">
      <main
        className="no-scroll-content"
        style={{
          gridTemplateColumns: "1fr 1.2fr",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Left Column: Diagnostics */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflow: "hidden" }}>
          {/* Panel 1: Comm settings */}
          <div className="isa-panel" style={{ flexShrink: 0 }}>
            <div className="isa-panel-header">OT HMI Communications Settings</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ color: "var(--text-muted)" }}>Primary Modbus TCP Gateway address:</span>
                <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>172.18.0.5:502 (OpenPLC Container)</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ color: "var(--text-muted)" }}>WebSocket telemetry connection URL:</span>
                <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>ws://localhost:8000/ws/telemetry</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ color: "var(--text-muted)" }}>HMI WebSocket connection status:</span>
                <span
                  style={{
                    fontWeight: "bold",
                    color: status === "connected" ? "var(--color-flow-cyan)" : "var(--color-alarm-critical)",
                  }}
                >
                  {status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Panel 2: Display config */}
          <div className="isa-panel" style={{ flex: 1 }}>
            <div className="isa-panel-header">ISA-101 Compliance Details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ color: "var(--text-muted)" }}>Visual Standard:</span>
                <span style={{ fontWeight: "bold" }}>ANSI/ISA-101.01-2015</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ color: "var(--text-muted)" }}>Design Palette Design Mode:</span>
                <span style={{ fontWeight: "bold" }}>High-Performance Matte Dark-Navy HUD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Role-gated settings (Admin only) */}
        {/* source: GET /api/v1/auth/me */}
        <div className="isa-panel" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="isa-panel-header">Role-Based Access Control (RBAC) Administration</div>

          {isAdmin ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px", fontSize: "0.8rem" }}>
              <div style={{ padding: "10px", backgroundColor: "rgba(14, 165, 233, 0.05)", border: "1px solid var(--color-flow-cyan)", borderRadius: "3px" }}>
                <span style={{ fontWeight: "bold", color: "var(--color-flow-cyan)" }}>ADMINISTRATOR PRIVILEGES ENGAGED</span>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Active Operator: <strong>{profile?.name}</strong>. You are authorized to modify user directories and adjust permissions.
                </p>
              </div>

              {/* RBAC matrix view */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", height: "30px" }}>
                      <th style={{ padding: "4px 8px" }}>Role</th>
                      <th style={{ padding: "4px 8px", textAlign: "center" }}>Actuate Valves/Pumps</th>
                      <th style={{ padding: "4px 8px", textAlign: "center" }}>Modify Setpoints</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", height: "35px" }}>
                      <td style={{ padding: "4px 8px", fontWeight: "bold" }}>ADMINISTRATOR</td>
                      <td style={{ padding: "4px 8px", textAlign: "center", color: "var(--color-flow-cyan)" }}>YES</td>
                      <td style={{ padding: "4px 8px", textAlign: "center", color: "var(--color-flow-cyan)" }}>YES</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", height: "35px" }}>
                      <td style={{ padding: "4px 8px", fontWeight: "bold" }}>OPERATOR</td>
                      <td style={{ padding: "4px 8px", textAlign: "center", color: "var(--color-flow-cyan)" }}>YES</td>
                      <td style={{ padding: "4px 8px", textAlign: "center", color: "var(--color-flow-cyan)" }}>YES</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", height: "35px" }}>
                      <td style={{ padding: "4px 8px", fontWeight: "bold" }}>AUDITOR</td>
                      <td style={{ padding: "4px 8px", textAlign: "center", color: "var(--color-alarm-critical)" }}>NO</td>
                      <td style={{ padding: "4px 8px", textAlign: "center", color: "var(--color-alarm-critical)" }}>NO</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                gap: "12px",
                color: "var(--text-muted)",
              }}
            >
              <svg width="48" height="48" fill="none" stroke="var(--color-alarm-critical)" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--color-alarm-critical)" }}>
                ACCESS RESTRICTED
              </span>
              <p style={{ fontSize: "0.75rem", textAlign: "center", maxWidth: "250px" }}>
                Administrator authorization is required to view RBAC directory permissions.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default Settings;
