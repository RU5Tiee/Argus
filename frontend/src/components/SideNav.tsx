import React from "react";

export type NavTabId =
  | "overview"
  | "pid"
  | "attack-monitor"
  | "alarm-console"
  | "settings";

interface SideNavProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
  userRole: string | null;
  fullname: string | null;
  onLogout: () => void;
  systemStatus: string;
  wsConnected: boolean;
}

interface TabItem {
  id: NavTabId;
  label: string;
  icon: React.ReactNode;
  allowedRoles?: string[]; // If undefined, all roles can view
}

export const SideNav: React.FC<SideNavProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  fullname,
  onLogout,
  systemStatus,
  wsConnected,
}) => {
  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Overview & Operations",
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: "pid",
      label: "P&ID & Controls",
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      id: "attack-monitor",
      label: "Attack Simulator",
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2.247a10 10 0 0 0-9 6.257V17a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8.504a10 10 0 0 0-9-6.257z" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
      ),
    },
    {
      id: "alarm-console",
      label: "SOC & Analytics Console",
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "System Settings",
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
  ];

  // Helper to determine status dot color for header
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "NORMAL":
        return "var(--color-flow-cyan)";
      case "WARNING":
        return "var(--color-alarm-high)";
      case "CRITICAL":
      case "SCRAM":
        return "var(--color-alarm-critical)";
      case "DECEPTION_ACTIVE":
        return "var(--color-alarm-medium)";
      default:
        return "var(--text-muted)";
    }
  };

  return (
    <aside
      style={{
        width: "260px",
        height: "100%",
        backgroundColor: "var(--bg-card)",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <div>
        {/* Project Branding */}
        <div
          style={{
            padding: "24px 20px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "1.3rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                color: "var(--text-primary)",
              }}
            >
              ARGUS
            </span>
            <span
              style={{
                fontSize: "0.65rem",
                padding: "2px 6px",
                borderRadius: "3px",
                backgroundColor: "var(--color-flow-cyan)",
                color: "var(--bg-primary)",
                fontWeight: "bold",
              }}
            >
              OT
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Process-Aware Deception & Twin
          </span>
        </div>

        {/* System Diagnostics status bar */}
        <div
          style={{
            padding: "12px 20px",
            backgroundColor: "rgba(255,255,255,0.01)",
            borderBottom: "1px solid var(--border-color)",
            fontSize: "0.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)" }}>Reactor State:</span>
            <span
              style={{
                color: getStatusColor(systemStatus),
                fontWeight: "bold",
                fontSize: "0.7rem",
              }}
            >
              {systemStatus}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)" }}>Telemetry Connection:</span>
            <span
              style={{
                color: wsConnected ? "var(--color-flow-cyan)" : "var(--color-alarm-critical)",
                fontWeight: "bold",
                fontSize: "0.7rem",
              }}
            >
              {wsConnected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* Tabs navigation list */}
        <nav style={{ padding: "12px 0", display: "flex", flexDirection: "column", gap: "2px" }}>
          {tabs.map((tab) => {
            // Role Guard checking if user has permissions
            if (tab.allowedRoles && userRole && !tab.allowedRoles.includes(userRole.toUpperCase())) {
              return null;
            }
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Operator profile card footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>{fullname || "Default Operator"}</span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            Role: {userRole || "OPERATOR"}
          </span>
        </div>
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "8px",
            backgroundColor: "transparent",
            border: "1px solid var(--border-color)",
            color: "var(--color-alarm-critical)",
            borderRadius: "4px",
            fontSize: "0.8rem",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          LOG OUT
        </button>
      </div>
    </aside>
  );
};
