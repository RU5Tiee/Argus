import React from "react";
import type { TelemetryPayload } from "../types/telemetry";

interface ProcessFlowAnimatorProps {
  telemetry: TelemetryPayload | null;
}

export const ProcessFlowAnimator: React.FC<ProcessFlowAnimatorProps> = ({ telemetry }) => {
  if (!telemetry) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: "var(--text-muted)",
          fontSize: "0.85rem",
        }}
      >
        Awaiting telemetry connection to animate process loop...
      </div>
    );
  }

  const { reactor, actuators } = telemetry;

  // Read live status values
  const fuelValveOpen = actuators.fuel_valve.state;
  const coolantPumpOn = actuators.coolant_pump.state;
  const heaterEngaged = actuators.heater_jacket.state;
  const reliefValveOpen = actuators.relief_valve.state;

  const rpmRaw = reactor.turbine_rpm.raw;
  const levelRaw = reactor.vessel_level.raw;

  // Determine rotation speeds based on values
  const turbineSpinDuration = rpmRaw > 0 ? `${Math.max(0.2, 5.0 - (rpmRaw / 3000) * 4.8)}s` : "0s";
  const agitatorSpinDuration = coolantPumpOn ? "1.5s" : "0s";

  // Calculate tank liquid fill height (SVG coordinate)
  const maxFillY = 220; // empty
  const minFillY = 120; // full
  const fillY = maxFillY - (levelRaw / 100) * (maxFillY - minFillY);

  return (
    <div
      className="isa-panel"
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* source: WS /ws/telemetry -> reactor, actuators */}
      <div className="isa-panel-header">Unit-03 Digital Twin Process Loop (ISA-101 Mimic)</div>

      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#060911",
          borderRadius: "4px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 800 420" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Defs for animations and gradients */}
          <defs>
            {/* Grid Pattern */}
            <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#1e293b" />
            </pattern>
            {/* Flow line dashes animation */}
            <style>
              {`
                @keyframes flow-dash {
                  to { stroke-dashoffset: -20; }
                }
                @keyframes spin-prop {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                @keyframes vent-steam {
                  0% { opacity: 0; transform: translateY(0) scale(1); }
                  50% { opacity: 0.5; }
                  100% { opacity: 0; transform: translateY(-30px) scale(1.5); }
                }
                .flow-active {
                  stroke-dasharray: 5, 5;
                  animation: flow-dash 1s linear infinite;
                }
                .spin-element {
                  animation: spin-prop linear infinite;
                }
                .steam-element {
                  animation: vent-steam 1.5s ease-out infinite;
                }
              `}
            </style>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#dot-grid)" />

          {/* ================================================================= */}
          {/* PIPES & FLOW PATHS */}
          {/* ================================================================= */}
          
          {/* 1. Fuel Inlet pipe (Attacker -> Valve -> Tank) */}
          <path d="M 50 150 L 150 150" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" />
          <path
            d="M 50 150 L 150 150"
            stroke={fuelValveOpen ? "var(--color-flow-cyan)" : "#334155"}
            strokeWidth="4"
            className={fuelValveOpen ? "flow-active" : ""}
          />

          {/* 2. Fuel to Tank Pipe */}
          <path d="M 190 150 L 260 150 L 260 110 L 300 110" stroke="#1E293B" strokeWidth="6" />
          <path
            d="M 190 150 L 260 150 L 260 110 L 300 110"
            stroke={fuelValveOpen ? "var(--color-flow-cyan)" : "#334155"}
            strokeWidth="4"
            className={fuelValveOpen ? "flow-active" : ""}
          />

          {/* 3. Coolant Loop Pipes */}
          <path d="M 300 210 L 200 210 L 200 320 L 300 320" stroke="#1E293B" strokeWidth="6" />
          <path
            d="M 300 210 L 200 210 L 200 320 L 300 320"
            stroke={coolantPumpOn ? "var(--color-flow-cyan)" : "#334155"}
            strokeWidth="4"
            className={coolantPumpOn ? "flow-active" : ""}
          />

          {/* 4. Steam to Turbine Pipe */}
          <path d="M 350 70 L 350 40 L 520 40 L 520 100" stroke="#1E293B" strokeWidth="8" />
          <path
            d="M 350 70 L 350 40 L 520 40 L 520 100"
            stroke={reactor.core_temp.status_color}
            strokeWidth="4"
            className={reactor.core_temp.status !== "normal" ? "flow-active" : ""}
          />

          {/* 5. Relief Valve Vent line */}
          <path d="M 380 90 L 440 90 L 440 60" stroke="#1E293B" strokeWidth="6" />
          <path
            d="M 380 90 L 440 90 L 440 60"
            stroke={reliefValveOpen ? "var(--color-alarm-critical)" : "#334155"}
            strokeWidth="4"
            className={reliefValveOpen ? "flow-active" : ""}
          />

          {/* ================================================================= */}
          {/* PHYSICAL EQUIPMENT SCHEMATICS */}
          {/* ================================================================= */}

          {/* Fuel Inlet Valve (V-101) */}
          <g transform="translate(150, 135)">
            <polygon points="0,0 30,30 30,0 0,30" fill={fuelValveOpen ? "var(--color-flow-cyan)" : "var(--color-inactive)"} stroke="#F8FAFC" strokeWidth="1.5" />
            <rect x="12" y="-5" width="6" height="15" fill="#F8FAFC" />
            <text x="-15" y="-10" fill="var(--text-muted)" fontSize="10" fontWeight="bold">V-101</text>
          </g>

          {/* Relief Valve (RV-101) */}
          <g transform="translate(425, 75)">
            <polygon points="0,0 30,30 30,0 0,30" fill={reliefValveOpen ? "var(--color-alarm-critical)" : "var(--color-inactive)"} stroke="#F8FAFC" strokeWidth="1.5" />
            <rect x="12" y="-5" width="6" height="15" fill="#F8FAFC" />
            <text x="35" y="15" fill="var(--text-muted)" fontSize="10" fontWeight="bold">RV-101</text>
          </g>

          {/* Steam Vent Cloud Animation */}
          {reliefValveOpen && (
            <g transform="translate(440, 30)">
              <circle cx="0" cy="0" r="10" fill="#E2E8F0" className="steam-element" />
              <circle cx="10" cy="-5" r="8" fill="#E2E8F0" className="steam-element" style={{ animationDelay: "0.5s" }} />
              <circle cx="-10" cy="-5" r="8" fill="#E2E8F0" className="steam-element" style={{ animationDelay: "1s" }} />
            </g>
          )}

          {/* Reactor Vessel (TK-101) */}
          <g transform="translate(300, 70)">
            {/* Outlines */}
            <rect width="100" height="200" rx="10" fill="rgba(21, 29, 42, 0.9)" stroke="#F8FAFC" strokeWidth="2.5" />
            
            {/* Liquid level fill */}
            <rect
              x="2.5"
              y={fillY - 70}
              width="95"
              height={267.5 - fillY}
              rx="2"
              fill={reactor.core_temp.status === "critical" || reactor.core_temp.status === "scram" ? "rgba(239, 68, 68, 0.4)" : "rgba(14, 165, 233, 0.3)"}
            />

            {/* Agitator Impeller shaft & blades (M-201) */}
            <line x1="50" y1="20" x2="50" y2="160" stroke="#E2E8F0" strokeWidth="3" />
            <g
              transform={`translate(50, 160)`}
              style={{
                transformOrigin: "center",
                animation: coolantPumpOn ? `spin-prop ${agitatorSpinDuration} linear infinite` : "none",
              }}
            >
              <rect x="-30" y="-5" width="60" height="10" fill="#E2E8F0" rx="2" />
              <rect x="-5" y="-30" width="10" height="60" fill="#E2E8F0" rx="2" opacity="0.8" />
            </g>

            {/* Heating Element coils (HTR-101) */}
            <path
              d="M 5,200 L 15,210 L 25,200 L 35,210 L 45,200 L 55,210 L 65,200 L 75,210 L 85,200 L 95,210"
              stroke={heaterEngaged ? "var(--color-alarm-critical)" : "#475569"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              style={{ filter: heaterEngaged ? "drop-shadow(0 0 5px var(--color-alarm-critical))" : "none" }}
            />

            {/* Instrument Labels overlay */}
            <text x="110" y="50" fill="var(--text-muted)" fontSize="10" fontWeight="bold">LT-101</text>
            <text x="110" y="65" fill="var(--text-primary)" fontSize="10">{reactor.vessel_level.formatted}</text>

            <text x="110" y="110" fill="var(--text-muted)" fontSize="10" fontWeight="bold">TT-101</text>
            <text
              x="110"
              y="125"
              fill={reactor.core_temp.status_color}
              fontSize="10"
              fontWeight="bold"
            >
              {reactor.core_temp.formatted}
            </text>

            <text x="110" y="170" fill="var(--text-muted)" fontSize="10" fontWeight="bold">PT-101</text>
            <text
              x="110"
              y="185"
              fill={reactor.core_pressure.status_color}
              fontSize="10"
              fontWeight="bold"
            >
              {reactor.core_pressure.formatted}
            </text>

            <text x="35" y="-12" fill="var(--text-primary)" fontSize="12" fontWeight="800">TK-101</text>
          </g>

          {/* Coolant Pump (M-201) */}
          <g transform="translate(180, 200)">
            <circle cx="20" cy="20" r="20" fill="var(--bg-card)" stroke="#F8FAFC" strokeWidth="2" />
            <path
              d="M 20 5 L 20 35 M 5 20 L 35 20"
              stroke="#F8FAFC"
              strokeWidth="2.5"
              style={{
                transformOrigin: "20px 20px",
                animation: coolantPumpOn ? `spin-prop 1s linear infinite` : "none",
              }}
            />
            <text x="-40" y="25" fill="var(--text-muted)" fontSize="10" fontWeight="bold">M-201</text>
          </g>

          {/* Steam Turbine (TURB-01) */}
          <g transform="translate(520, 80)">
            {/* Turbine Housing */}
            <polygon points="0,0 80,-20 80,80 0,60" fill="rgba(21, 29, 42, 0.9)" stroke="#F8FAFC" strokeWidth="2.5" />
            
            {/* Spinning Blades inside */}
            <line x1="10" y1="30" x2="70" y2="30" stroke="#94A3B8" strokeWidth="4" />
            <g
              transform="translate(40, 30)"
              style={{
                transformOrigin: "center",
                animation: rpmRaw > 0 ? `spin-prop ${turbineSpinDuration} linear infinite` : "none",
              }}
            >
              <line x1="-30" y1="0" x2="30" y2="0" stroke="#F8FAFC" strokeWidth="3" />
              <line x1="0" y1="-30" x2="0" y2="30" stroke="#F8FAFC" strokeWidth="3" />
            </g>
            <text x="15" y="-28" fill="var(--text-primary)" fontSize="10" fontWeight="bold">TURBINE</text>
            <text x="90" y="25" fill="var(--text-muted)" fontSize="10" fontWeight="bold">RPM</text>
            <text x="90" y="40" fill={reactor.turbine_rpm.status_color} fontSize="11" fontWeight="bold">
              {reactor.turbine_rpm.formatted}
            </text>
          </g>

          {/* Shaft coupling */}
          <line x1="600" y1="110" x2="650" y2="110" stroke="#E2E8F0" strokeWidth="4" />

          {/* Generator (GEN-01) & Electrical Output */}
          <g transform="translate(650, 85)">
            <rect width="90" height="50" rx="3" fill="var(--bg-card)" stroke="#F8FAFC" strokeWidth="2" />
            <circle cx="45" cy="25" r="15" fill="#1e293b" />
            <text x="40" y="29" fill="var(--color-flow-cyan)" fontSize="12" fontWeight="bold">G</text>
            <text x="15" y="-10" fill="var(--text-muted)" fontSize="10" fontWeight="bold">GEN-101</text>
            
            {/* Output electrical bolts overlay */}
            {reactor.turbine_rpm.status !== "scram" && reactor.turbine_rpm.status !== "inactive" && (
              <path
                d="M 110,15 L 100,25 L 115,25 L 105,35"
                stroke="#EAB308"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                style={{ filter: "drop-shadow(0 0 3px #EAB308)" }}
              />
            )}
            <text x="5" y="70" fill="var(--text-muted)" fontSize="10" fontWeight="bold">Power Output</text>
            <text x="5" y="83" fill="var(--color-flow-cyan)" fontSize="11" fontWeight="bold">
              {reactor.electrical_power.formatted}
            </text>
          </g>
        </svg>

        {/* Live HUD Floating Labels */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            display: "flex",
            gap: "12px",
            fontSize: "0.75rem",
          }}
        >
          <div style={{ padding: "6px 10px", backgroundColor: "rgba(0,0,0,0.6)", border: "1px solid var(--border-color)", borderRadius: "3px" }}>
            <span style={{ color: "var(--text-muted)" }}>Fuel Valve (V-101): </span>
            <span style={{ color: fuelValveOpen ? "var(--color-flow-cyan)" : "var(--text-muted)" }}>
              {actuators.fuel_valve.formatted}
            </span>
          </div>
          <div style={{ padding: "6px 10px", backgroundColor: "rgba(0,0,0,0.6)", border: "1px solid var(--border-color)", borderRadius: "3px" }}>
            <span style={{ color: "var(--text-muted)" }}>Coolant Loop Pump: </span>
            <span style={{ color: coolantPumpOn ? "var(--color-flow-cyan)" : "var(--text-muted)" }}>
              {actuators.coolant_pump.formatted}
            </span>
          </div>
          <div style={{ padding: "6px 10px", backgroundColor: "rgba(0,0,0,0.6)", border: "1px solid var(--border-color)", borderRadius: "3px" }}>
            <span style={{ color: "var(--text-muted)" }}>Electrical Heater: </span>
            <span style={{ color: heaterEngaged ? "var(--color-flow-cyan)" : "var(--text-muted)" }}>
              {actuators.heater_jacket.formatted}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProcessFlowAnimator;
