import React from "react";
import { useTelemetry } from "../context/TelemetryContext";
import { ProcessFlowAnimator } from "../components/ProcessFlowAnimator";

export const PID: React.FC = () => {
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
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>P&ID Mimic Panel (ANSI/ISA-5.1)</h1>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Reactor Loop Loop-03 Diagnostics
        </div>
      </header>

      <main className="no-scroll-content" style={{ gridTemplateRows: "1fr" }}>
        <ProcessFlowAnimator telemetry={telemetry} />
      </main>
    </div>
  );
};
export default PID;
