import React, { useEffect, useState } from "react";
import { useTelemetry } from "../context/TelemetryContext";
import { NetworkTopology } from "../components/NetworkTopology";
import { AttackTimeline } from "../components/AttackTimeline";

export const AttackMonitor: React.FC = () => {
  const { telemetry, authToken } = useTelemetry();
  const [activeScenario, setActiveScenario] = useState<any>(null);

  const fetchActiveScenario = () => {
    fetch("http://localhost:8000/api/v1/simulation/active")
      .then((res) => res.json())
      .then((data) => {
        if (data.active) {
          setActiveScenario(data.scenario);
        } else {
          setActiveScenario(null);
        }
      })
      .catch((err) => console.error("Error loading active scenario:", err));
  };

  // Poll active scenario timeline state every 1 second
  useEffect(() => {
    fetchActiveScenario();
    const interval = setInterval(fetchActiveScenario, 1000);
    return () => clearInterval(interval);
  }, []);

  // Retrieve current active step of the attack simulation
  const currentStep = activeScenario && activeScenario.is_running && activeScenario.timeline
    ? activeScenario.timeline[activeScenario.current_step_index]
    : null;

  return (
    <div className="no-scroll-container" style={{ height: "100%" }}>
      <main
        className="no-scroll-content"
        style={{
          gridTemplateRows: "1.1fr 1.2fr",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* Top: Graphical Network Map with packet travel */}
        {/* source: GET /api/v1/simulation/active */}
        <NetworkTopology telemetry={telemetry} activeScenario={activeScenario} />

        {/* Bottom: Splits timeline triggers and active forensics inspector side-by-side */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px", overflow: "hidden" }}>
          {/* Left panel: Timeline control & step checklist */}
          <AttackTimeline
            telemetry={telemetry}
            authToken={authToken}
            activeScenario={activeScenario}
            onRefreshActiveScenario={fetchActiveScenario}
          />

          {/* Right panel: Attack Chain Forensics & Impact Inspector */}
          {/* source: GET /api/v1/simulation/active */}
          <div className="isa-panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="isa-panel-header" style={{ color: "var(--color-alarm-critical)" }}>
              Attack Chain Forensics & Process Impact
            </div>

            {currentStep ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px", fontSize: "0.8rem", overflowY: "auto" }}>
                {/* 1. Attack Vector & Target */}
                <div style={{ padding: "8px 10px", backgroundColor: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "3px" }}>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>TARGET NODE & REGISTER</span>
                  <strong style={{ color: "var(--color-alarm-critical)" }}>{currentStep.target_node}</strong>
                  {currentStep.target_register && (
                    <span style={{ display: "block", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--color-flow-cyan)", marginTop: "4px" }}>
                      Modbus Address: {currentStep.target_register}
                    </span>
                  )}
                </div>

                {/* 2. Injected Payload */}
                <div style={{ padding: "8px 10px", backgroundColor: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "3px" }}>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>INJECTED PAYLOAD VALUE</span>
                  <strong style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--color-alarm-high)" }}>
                    {currentStep.payload_value || "N/A / Probing Scan"}
                  </strong>
                </div>

                {/* 3. Physical Process Effect */}
                <div style={{ padding: "8px 10px", backgroundColor: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "3px" }}>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>PHYSICAL PROCESS IMPACT</span>
                  <p style={{ margin: "4px 0 0 0", color: "var(--text-primary)", fontWeight: "bold" }}>
                    {currentStep.physical_impact || "None (Discovery/Lateral Movement)"}
                  </p>
                </div>

                {/* 4. Active Defense & Mitigation Result */}
                <div style={{ padding: "8px 10px", backgroundColor: "rgba(14, 165, 233, 0.03)", border: "1px solid rgba(14, 165, 233, 0.2)", borderRadius: "3px" }}>
                  <span style={{ fontSize: "0.65rem", color: "var(--color-flow-cyan)", display: "block", fontWeight: "bold" }}>ACTIVE DEFENSE MITIGATION RESULT</span>
                  <p style={{ margin: "4px 0 0 0", color: "var(--text-primary)", fontSize: "0.75rem", lineHeight: "1.4" }}>
                    {currentStep.mitigation_result || "N/A"}
                  </p>
                </div>

                {/* 5. Execution Script Code */}
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Exploit Command executed:
                  </span>
                  <pre
                    style={{
                      margin: 0,
                      padding: "8px",
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "3px",
                      fontFamily: "monospace",
                      fontSize: "0.7rem",
                      color: "#A7F3D0",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {currentStep.code_snippet}
                  </pre>
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
                  color: "var(--text-muted)",
                  gap: "8px",
                }}
              >
                <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span style={{ fontSize: "0.75rem" }}>
                  Trigger an attack scenario to inspect the forensic details.
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
export default AttackMonitor;
