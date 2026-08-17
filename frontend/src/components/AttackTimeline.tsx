import React, { useEffect, useState } from "react";
import type { TelemetryPayload } from "../types/telemetry";

interface Scenario {
  id: string;
  name: string;
  mitre_id: string;
  description: string;
  severity: string;
  target: string;
}

interface AttackStep {
  step_number: number;
  timestamp: string;
  phase: string;
  title: string;
  technique_id: string;
  technique_name: string;
  origin_node: string;
  target_node: string;
  code_snippet: string;
  status: string;
  status_color: string;
  animation_cue: any;
}

interface ActiveScenarioState {
  scenario_id: string;
  scenario_name: string;
  description: string;
  target_mitre_id: string;
  is_running: boolean;
  current_step_index: number;
  total_steps: number;
  timeline: AttackStep[];
}

interface AttackTimelineProps {
  telemetry: TelemetryPayload | null;
  authToken: string | null;
  activeScenario: ActiveScenarioState | null;
  onRefreshActiveScenario: () => void;
}

export const AttackTimeline: React.FC<AttackTimelineProps> = ({
  telemetry,
  authToken,
  activeScenario,
  onRefreshActiveScenario,
}) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("fdi_injection");
  const [vulnerableMode, setVulnerableMode] = useState<boolean>(false);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Sync mode state from telemetry payload
  useEffect(() => {
    if (telemetry) {
      setVulnerableMode(!!telemetry.vulnerable_mode);
    }
  }, [telemetry]);

  // Load scenarios
  useEffect(() => {
    fetch("http://localhost:8000/api/v1/simulation/scenarios")
      .then((res) => res.json())
      .then((data) => {
        if (data.scenarios) {
          setScenarios(data.scenarios);
        }
      })
      .catch((err) => console.error("Error loading scenarios:", err));
  }, []);

  const triggerStartScenario = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/simulation/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify({
          scenario_id: selectedScenarioId,
          attacker_ip: "192.168.1.105",
        }),
      });
      if (response.ok) {
        onRefreshActiveScenario();
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail?.message || "Lacks write permissions to start scenarios."}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const triggerStopScenario = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/simulation/stop", {
        method: "POST",
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
      });
      if (response.ok) {
        onRefreshActiveScenario();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const toggleDemoMode = async (checked: boolean) => {
    setIsActionLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/system/mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify({ vulnerable_mode: checked }),
      });
      if (response.ok) {
        setVulnerableMode(checked);
      } else {
        const err = await response.json();
        alert(`Access Denied: ${err.detail?.message || "Lacks write permissions to toggle system settings."}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Scenario Selection Panel */}
      <div className="isa-panel" style={{ flexShrink: 0 }}>
        <div className="isa-panel-header">Adversary Emulation Console</div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Demonstration Mode Switcher */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px",
              backgroundColor: vulnerableMode ? "rgba(239, 68, 68, 0.05)" : "rgba(14, 165, 233, 0.05)",
              border: `1px solid ${vulnerableMode ? "var(--color-alarm-critical)" : "var(--color-flow-cyan)"}`,
              borderRadius: "3px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                Demonstration Mode: {vulnerableMode ? "VULNERABLE (IDS Bypass)" : "PROTECTED (Active Defense)"}
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                {vulnerableMode
                  ? "Attacks reach PLC, modifying physical states."
                  : "PB-IDS CUSUM validates process rules and overwrites FDI in <40ms."}
              </span>
            </div>
            <input
              type="checkbox"
              checked={vulnerableMode}
              disabled={isActionLoading}
              onChange={(e) => toggleDemoMode(e.target.checked)}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer",
              }}
            />
          </div>

          {/* Selector list */}
          <div style={{ display: "flex", gap: "8px" }}>
            <select
              value={selectedScenarioId}
              disabled={isActionLoading || (activeScenario?.is_running ?? false)}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              style={{
                flex: 1,
                padding: "8px",
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                borderRadius: "3px",
                fontSize: "0.8rem",
                outline: "none",
              }}
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {activeScenario && activeScenario.is_running ? (
              <button
                onClick={triggerStopScenario}
                disabled={isActionLoading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "var(--color-alarm-critical)",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                STOP
              </button>
            ) : (
              <button
                onClick={triggerStartScenario}
                disabled={isActionLoading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "var(--color-flow-cyan)",
                  color: "var(--bg-primary)",
                  border: "none",
                  borderRadius: "3px",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                TRIGGER
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Attack Timeline Panel */}
      <div className="isa-panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div className="isa-panel-header">Attack Propagation Timeline</div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
          {activeScenario ? (
            activeScenario.timeline.map((step, idx) => {
              const isActive = idx === activeScenario.current_step_index;
              const isPast = idx < activeScenario.current_step_index;
              
              return (
                <div
                  key={step.step_number}
                  style={{
                    display: "flex",
                    gap: "12px",
                    opacity: isActive || isPast ? 1.0 : 0.25,
                    borderLeft: `2px solid ${isActive ? "var(--color-alarm-high)" : (isPast ? "var(--color-flow-cyan)" : "var(--border-color)")}`,
                    paddingLeft: "12px",
                    marginLeft: "6px",
                    position: "relative",
                  }}
                >
                  {/* Ring indicator */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-6px",
                      top: "2px",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: isActive ? "var(--color-alarm-high)" : (isPast ? "var(--color-flow-cyan)" : "var(--bg-card)"),
                      border: "2px solid var(--border-color)",
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>
                        Step {step.step_number}: {step.title}
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                        {step.phase}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      Node Flow: <span style={{ color: "var(--text-primary)" }}>{step.origin_node}</span> &rarr;{" "}
                      <span style={{ color: "var(--text-primary)" }}>{step.target_node}</span>
                    </div>

                    {isActive && (
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "8px",
                          backgroundColor: "var(--bg-primary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "3px",
                        }}
                      >
                        <span style={{ fontSize: "0.65rem", color: "var(--color-alarm-low)", fontWeight: "bold" }}>
                          MITRE ATT&CK: {step.technique_id} - {step.technique_name}
                        </span>
                        <p style={{ fontSize: "0.7rem", color: "var(--text-primary)", marginTop: "4px" }}>
                          Status: <span style={{ color: step.status_color }}>{step.status}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
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
              No active scenario. Select and trigger an emulation from the panel above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default AttackTimeline;
