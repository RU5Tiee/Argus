import React, { useState } from "react";
import { useTelemetry } from "./context/TelemetryContext";
import { SideNav } from "./components/SideNav";
import type { NavTabId } from "./components/SideNav";
import { Login } from "./pages/Login";

// Import consolidated HMI pages
import { Overview } from "./pages/Overview";
import { ControlRoom } from "./pages/ControlRoom";
import { AlarmConsole } from "./pages/AlarmConsole";
import { AttackMonitor } from "./pages/AttackMonitor";
import { Settings } from "./pages/Settings";

export const App: React.FC = () => {
  const { telemetry, status, authToken, setAuthToken } = useTelemetry();
  const [role, setRole] = useState<string | null>(localStorage.getItem("argus_role"));
  const [fullname, setFullname] = useState<string | null>(localStorage.getItem("argus_fullname"));
  const [activeTab, setActiveTab] = useState<NavTabId>("overview");

  // Sync auth state
  const handleLoginSuccess = (token: string, userRole: string, userLogin: string, name: string) => {
    localStorage.setItem("argus_role", userRole);
    localStorage.setItem("argus_username", userLogin);
    localStorage.setItem("argus_fullname", name);
    setRole(userRole);
    setFullname(name);
    setAuthToken(token);
  };

  const handleLogout = () => {
    setRole(null);
    setFullname(null);
    setAuthToken(null);
  };

  // Route guarding implementation
  const isTabAllowed = (tab: NavTabId): boolean => {
    if (!role) return false;
    const upperRole = role.toUpperCase();
    if (tab === "pid") {
      return ["ADMINISTRATOR", "OPERATOR"].includes(upperRole);
    }
    return true;
  };

  const getPageMeta = (tab: NavTabId) => {
    switch (tab) {
      case "overview":
        return {
          title: "Overview & Operations Mimic",
          subtitle: "Unit-03 physical loop telemetry and process mimics"
        };
      case "pid":
        return {
          title: "P&ID Screen & Controls",
          subtitle: "ANSI/ISA-5.1 process diagram flows and actuator overrides"
        };
      case "attack-monitor":
        return {
          title: "Red Team Attack Simulator",
          subtitle: "Chronological adversary TTP propagation and kinetic analysis"
        };
      case "alarm-console":
        return {
          title: "SOC Threat & Alarm Console",
          subtitle: "ISA-18.2 alarms log, CUSUM anomalies, and SQLite WAL events"
        };
      case "settings":
        return {
          title: "System Settings & RBAC",
          subtitle: "Communications gateway links and active user directories"
        };
      default:
        return {
          title: "Argus OT Security Gateway",
          subtitle: "Industrial security controls"
        };
    }
  };

  const handleToggleSecurity = async () => {
    const isVulnerable = telemetry?.vulnerable_mode || false;
    try {
      const response = await fetch("http://localhost:8000/api/v1/system/mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify({ vulnerable_mode: !isVulnerable }),
      });
      if (!response.ok) {
        alert("Failed to toggle security mode.");
      }
    } catch (err) {
      console.error("Error toggling security mode:", err);
    }
  };

  const renderActivePage = () => {
    if (!isTabAllowed(activeTab)) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            backgroundColor: "var(--bg-primary)",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              padding: "16px",
              border: "1px solid var(--color-alarm-critical)",
              backgroundColor: "rgba(239, 68, 68, 0.05)",
              color: "var(--color-alarm-critical)",
              borderRadius: "4px",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            <h3 style={{ marginBottom: "8px" }}>403 ACCESS FORBIDDEN</h3>
            <p style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
              Your current authentication role <strong>({role})</strong> lacks permissions to access the Supervisory Control Room.
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "pid":
        return <ControlRoom />;
      case "attack-monitor":
        return <AttackMonitor />;
      case "alarm-console":
        return <AlarmConsole />;
      case "settings":
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  if (!authToken) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const pageMeta = getPageMeta(activeTab);
  const isVulnerable = telemetry?.vulnerable_mode || false;

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Persistent ISA-101 Sidebar Navigation */}
      <SideNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={role}
        fullname={fullname}
        onLogout={handleLogout}
        systemStatus={telemetry?.system_status || "NORMAL"}
        wsConnected={status === "connected"}
      />

      {/* Main Viewport Container */}
      <div
        style={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          padding: "20px 24px",
          boxSizing: "border-box"
        }}
      >
        {/* Global Unified Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border-color)",
            paddingBottom: "12px",
            flexShrink: 0,
            marginBottom: "16px"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>
              {pageMeta.title}
            </h1>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {pageMeta.subtitle}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Global Security Mode Toggle Button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-color)",
                padding: "6px 12px",
                borderRadius: "4px"
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-muted)" }}>
                DEFENSE SHIELD:
              </span>
              <button
                onClick={handleToggleSecurity}
                style={{
                  padding: "4px 10px",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  borderRadius: "3px",
                  cursor: "pointer",
                  border: "none",
                  transition: "all 0.2s ease",
                  backgroundColor: isVulnerable ? "rgba(239, 68, 68, 0.15)" : "rgba(14, 165, 233, 0.15)",
                  color: isVulnerable ? "var(--color-alarm-critical)" : "var(--color-flow-cyan)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: isVulnerable ? "var(--color-alarm-critical)" : "var(--color-flow-cyan)"
                }}
              >
                {isVulnerable ? "BYPASS (VULNERABLE)" : "ACTIVE (PROTECTED)"}
              </button>
            </div>

            {/* Link Connection Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem" }}>
              <span style={{ color: "var(--text-muted)" }}>HMI LINK:</span>
              <span
                style={{
                  fontWeight: "bold",
                  color: status === "connected" ? "var(--color-flow-cyan)" : "var(--color-alarm-critical)"
                }}
              >
                {status.toUpperCase()}
              </span>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: status === "connected" ? "var(--color-flow-cyan)" : "var(--color-alarm-critical)",
                  boxShadow: status === "connected" ? "0 0 8px var(--color-flow-cyan)" : "none"
                }}
              />
            </div>
          </div>
        </header>

        {/* Dynamic page contents wrapper */}
        <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
          {renderActivePage()}
        </div>
      </div>
    </div>
  );
};
export default App;
