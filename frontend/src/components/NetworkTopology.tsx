import React, { useEffect, useState } from "react";
import type { TelemetryPayload } from "../types/telemetry";

interface NetworkTopologyProps {
  telemetry: TelemetryPayload | null;
  activeScenario: any; // Checked from backend API
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  telemetry,
  activeScenario,
}) => {
  const [pulsePath, setPulsePath] = useState<string | null>(null);
  const [pulseColor, setPulseColor] = useState<string>("var(--color-flow-cyan)");

  // Live packet flows based on telemetry activity or active simulated steps
  useEffect(() => {
    if (activeScenario && activeScenario.is_running) {
      const stepIndex = activeScenario.current_step_index;
      const currentStep = activeScenario.timeline[stepIndex];
      if (currentStep && currentStep.animation_cue) {
        const cue = currentStep.animation_cue;
        setPulsePath(cue.flow);
        setPulseColor(cue.color || "var(--color-alarm-critical)");
      }
    } else {
      setPulsePath(null);
    }
  }, [activeScenario]);

  // Coordinates of our nodes
  const nodes = {
    attacker: { x: 100, y: 80, label: "Attacker (RED TEAM)", ip: "192.168.1.105" },
    hmi: { x: 700, y: 80, label: "Operator HMI (OWS)", ip: "172.18.0.10" },
    switch: { x: 400, y: 150, label: "L2 Industrial Switch", ip: "172.18.0.1" },
    ids: { x: 250, y: 280, label: "PB-IDS Monitor", ip: "172.18.0.8" },
    plc: { x: 550, y: 280, label: "OpenPLC Core", ip: "172.18.0.5" },
    db: { x: 250, y: 370, label: "SQLite DB (WAL)", ip: "172.18.0.9" },
  };

  const getPathD = (flow: string) => {
    switch (flow) {
      case "RED_TEAM->PLC":
        return `M ${nodes.attacker.x} ${nodes.attacker.y} L ${nodes.switch.x} ${nodes.switch.y} L ${nodes.plc.x} ${nodes.plc.y}`;
      case "PB_IDS->PLC":
        return `M ${nodes.ids.x} ${nodes.ids.y} L ${nodes.plc.x} ${nodes.plc.y}`;
      case "RED_TEAM->PLC->PB_IDS":
        return `M ${nodes.attacker.x} ${nodes.attacker.y} L ${nodes.switch.x} ${nodes.switch.y} L ${nodes.plc.x} ${nodes.plc.y} L ${nodes.ids.x} ${nodes.ids.y}`;
      case "PLC->VESSEL":
        return `M ${nodes.plc.x} ${nodes.plc.y} L 680 320`;
      default:
        return null;
    }
  };

  const activePathD = pulsePath ? getPathD(pulsePath) : null;

  return (
    <div className="isa-panel" style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="isa-panel-header">IT / OT Converged Network Topology</div>

      <div
        style={{
          flex: 1,
          backgroundColor: "#060911",
          borderRadius: "4px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 800 420" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Grid lines background */}
          <defs>
            <pattern id="net-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.75" fill="#1e293b" />
            </pattern>
            <style>
              {`
                @keyframes packet-travel {
                  to { stroke-dashoffset: -40; }
                }
                .packet-pulse {
                  stroke-dasharray: 8, 12;
                  animation: packet-travel 1.5s linear infinite;
                }
              `}
            </style>
          </defs>
          <rect width="100%" height="100%" fill="url(#net-grid)" />

          {/* ================================================================= */}
          {/* STATIC CONNECTION LINKS */}
          {/* ================================================================= */}
          
          {/* Attacker to Switch */}
          <line x1={nodes.attacker.x} y1={nodes.attacker.y} x2={nodes.switch.x} y2={nodes.switch.y} stroke="#1E293B" strokeWidth="2.5" />
          
          {/* HMI to Switch */}
          <line x1={nodes.hmi.x} y1={nodes.hmi.y} x2={nodes.switch.x} y2={nodes.switch.y} stroke="#1E293B" strokeWidth="2.5" />
          
          {/* Switch to PLC */}
          <line x1={nodes.switch.x} y1={nodes.switch.y} x2={nodes.plc.x} y2={nodes.plc.y} stroke="#1E293B" strokeWidth="2.5" />
          
          {/* Switch to IDS */}
          <line x1={nodes.switch.x} y1={nodes.switch.y} x2={nodes.ids.x} y2={nodes.ids.y} stroke="#1E293B" strokeWidth="2.5" opacity="0.6" />
          
          {/* IDS to PLC (Mirrored port scanning / validation link) */}
          <line x1={nodes.ids.x} y1={nodes.ids.y} x2={nodes.plc.x} y2={nodes.plc.y} stroke="#1e293b" strokeWidth="2" strokeDasharray="3,3" />

          {/* IDS to DB Logger */}
          <line x1={nodes.ids.x} y1={nodes.ids.y} x2={nodes.db.x} y2={nodes.db.y} stroke="#1e293b" strokeWidth="2" />

          {/* ================================================================= */}
          {/* DYNAMIC PACKET ANIMATION LAYERS */}
          {/* ================================================================= */}
          {activePathD && (
            <>
              {/* Glowing active path */}
              <path d={activePathD} stroke={pulseColor} strokeWidth="4" opacity="0.25" strokeLinecap="round" />
              {/* Moving packet dot */}
              <path
                d={activePathD}
                stroke={pulseColor}
                strokeWidth="3.5"
                className="packet-pulse"
                strokeLinecap="round"
              />
            </>
          )}

          {/* ================================================================= */}
          {/* NETWORK NODE SCHEMATICS */}
          {/* ================================================================= */}

          {/* 1. Attacker Node */}
          <g transform={`translate(${nodes.attacker.x}, ${nodes.attacker.y})`}>
            <circle r="22" fill={pulsePath ? "var(--color-alarm-critical)" : "var(--bg-card)"} stroke={pulsePath ? "var(--color-alarm-critical)" : "var(--border-color)"} strokeWidth="2" />
            <path d="M-10,-10 L10,10 M10,-10 L-10,10" stroke={pulsePath ? "#FFF" : "var(--text-muted)"} strokeWidth="2" />
            <text x="-50" y="38" fill="var(--text-primary)" fontSize="10" fontWeight="bold">{nodes.attacker.label}</text>
            <text x="-40" y="50" fill="var(--text-muted)" fontSize="9">{nodes.attacker.ip}</text>
          </g>

          {/* 2. Switch Node */}
          <g transform={`translate(${nodes.switch.x}, ${nodes.switch.y})`}>
            <rect x="-24" y="-12" width="48" height="24" rx="3" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="2" />
            <circle cx="-12" cy="0" r="4" fill="var(--color-flow-cyan)" />
            <circle cx="12" cy="0" r="4" fill={pulsePath ? "var(--color-alarm-high)" : "var(--text-muted)"} />
            <text x="-48" y="-22" fill="var(--text-primary)" fontSize="10" fontWeight="bold">{nodes.switch.label}</text>
          </g>

          {/* 3. OWS HMI Node */}
          <g transform={`translate(${nodes.hmi.x}, ${nodes.hmi.y})`}>
            <rect x="-24" y="-20" width="48" height="32" rx="3" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="2" />
            <rect x="-16" y="-12" width="32" height="18" fill="#1e293b" />
            <line x1="-8" y1="16" x2="8" y2="16" stroke="var(--border-color)" strokeWidth="3" />
            <text x="-50" y="30" fill="var(--text-primary)" fontSize="10" fontWeight="bold">{nodes.hmi.label}</text>
            <text x="-40" y="42" fill="var(--text-muted)" fontSize="9">{nodes.hmi.ip}</text>
          </g>

          {/* 4. OpenPLC Node */}
          <g transform={`translate(${nodes.plc.x}, ${nodes.plc.y})`}>
            <circle r="22" fill={telemetry?.estop_active ? "var(--color-alarm-critical)" : "var(--bg-card)"} stroke={telemetry?.estop_active ? "var(--color-alarm-critical)" : "var(--border-color)"} strokeWidth="2" />
            <rect x="-10" y="-10" width="20" height="20" fill="none" stroke={telemetry?.estop_active ? "#FFF" : "var(--color-flow-cyan)"} strokeWidth="2" />
            <text x="-45" y="38" fill="var(--text-primary)" fontSize="10" fontWeight="bold">{nodes.plc.label}</text>
            <text x="-35" y="50" fill="var(--text-muted)" fontSize="9">{nodes.plc.ip}</text>
          </g>

          {/* 5. PB-IDS Node */}
          <g transform={`translate(${nodes.ids.x}, ${nodes.ids.y})`}>
            <polygon points="0,-22 20,10 -20,10" fill="var(--bg-card)" stroke={telemetry?.deception_active ? "var(--color-alarm-medium)" : "var(--border-color)"} strokeWidth="2" />
            <text x="-50" y="28" fill="var(--text-primary)" fontSize="10" fontWeight="bold">{nodes.ids.label}</text>
          </g>

          {/* 6. SQLite WAL Database */}
          <g transform={`translate(${nodes.db.x}, ${nodes.db.y})`}>
            <ellipse cx="0" cy="-10" rx="20" ry="8" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="2" />
            <path d="M-20,-10 L-20,10 A20,8 0 0,0 20,10 L20,-10" fill="var(--bg-card)" stroke="var(--border-color)" strokeWidth="2" />
            <text x="-50" y="30" fill="var(--text-primary)" fontSize="10" fontWeight="bold">{nodes.db.label}</text>
          </g>
        </svg>

        {/* Live HUD active overlays */}
        {pulsePath && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              padding: "8px 12px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid var(--color-alarm-critical)",
              borderRadius: "3px",
              color: "var(--color-alarm-critical)",
              fontSize: "0.75rem",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "var(--color-alarm-critical)",
                animation: "spin-prop 1s linear infinite",
              }}
            />
            ACTIVE EXPLOIT PROPAGATION DETECTED
          </div>
        )}
      </div>
    </div>
  );
};
export default NetworkTopology;
