import React from "react";
import { useTelemetry } from "../context/TelemetryContext";

export const PlantOperation: React.FC = () => {
  const { telemetry } = useTelemetry();

  if (!telemetry) {
    return (
      <div className="no-scroll-container">
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Plant Operations Telemetry</h1>
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "20px" }}>
          Connecting to telemetry server...
        </div>
      </div>
    );
  }

  const { reactor } = telemetry;

  // Groupings for displaying the turbine, fuel, and water loop parameters
  const turbineParams = [
    { label: "Steam Temperature", tag: "TT-201", val: reactor.steam_temp },
    { label: "Steam Pressure", tag: "PT-201", val: reactor.steam_pressure },
    { label: "Turbine Mechanical Torque", tag: "TRQ-01", val: reactor.turbine_torque },
    { label: "Turbine Rotation Speed", tag: "ST-201", val: reactor.turbine_rpm },
    { label: "Generator Output Percentage", tag: "GEN-01", val: reactor.generator_output },
    { label: "Electrical Power Output", tag: "MW-01", val: reactor.electrical_power },
  ];

  const fuelParams = [
    { label: "Fuel Loop Pressure", tag: "PT-102", val: reactor.fuel_pressure },
    { label: "Reactant Feed Flow Rate", tag: "FT-101", val: reactor.fuel_flow },
  ];

  const waterParams = [
    { label: "Reactor Core Temperature", tag: "TT-101", val: reactor.core_temp },
    { label: "Reactor Vessel Pressure", tag: "PT-101", val: reactor.core_pressure },
    { label: "Coolant Loop Flow Rate", tag: "FT-201", val: reactor.coolant_flow },
    { label: "Coolant Loop Temperature", tag: "TT-202", val: reactor.coolant_temp },
    { label: "Vessel Liquid Level", tag: "LT-101", val: reactor.vessel_level },
  ];

  const renderParameterRows = (params: typeof turbineParams) => {
    return params.map((p) => (
      <tr key={p.label} style={{ borderBottom: "1px solid rgba(255,255,255,0.02)", height: "35px" }}>
        <td style={{ padding: "4px 8px" }}>{p.label}</td>
        <td style={{ padding: "4px 8px", fontFamily: "monospace", color: "var(--text-muted)" }}>{p.tag}</td>
        <td
          style={{
            padding: "4px 8px",
            textAlign: "right",
            fontFamily: "monospace",
            fontWeight: "bold",
            color: p.val.status_color, // Bound directly from backend field
          }}
        >
          {p.val.formatted} {/* Bound directly from backend field */}
        </td>
        <td style={{ padding: "4px 8px", textAlign: "center" }}>
          <span
            style={{
              fontSize: "0.65rem",
              padding: "2px 6px",
              borderRadius: "3px",
              backgroundColor: "rgba(255,255,255,0.02)",
              color: p.val.status_color, // Bound directly from backend field
              fontWeight: "bold",
            }}
          >
            {p.val.status.toUpperCase()} {/* Bound directly from backend field */}
          </span>
        </td>
      </tr>
    ));
  };

  return (
    <div className="no-scroll-container">
      {/* source: WS /ws/telemetry -> system_status */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "12px",
        }}
      >
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Plant Operations & Telemetry Diagnostics</h1>
        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          Nuclear plant steam turbine parameters
        </div>
      </header>

      <main
        className="no-scroll-content"
        style={{
          gridTemplateColumns: "1.2fr 1fr 1fr",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Panel 1: Turbine Generator Drive Chain */}
        {/* source: WS /ws/telemetry -> reactor.steam_temp, reactor.steam_pressure, reactor.turbine_torque, reactor.turbine_rpm, reactor.generator_output, reactor.electrical_power */}
        <div className="isa-panel" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="isa-panel-header">Turbine Generator Drive Chain</div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", height: "30px" }}>
                  <th style={{ padding: "4px 8px" }}>Parameter</th>
                  <th style={{ padding: "4px 8px" }}>Tag</th>
                  <th style={{ padding: "4px 8px", textAlign: "right" }}>Value</th>
                  <th style={{ padding: "4px 8px", textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>{renderParameterRows(turbineParams)}</tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: Fuel Feed Loop System */}
        {/* source: WS /ws/telemetry -> reactor.fuel_pressure, reactor.fuel_flow */}
        <div className="isa-panel" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="isa-panel-header">Fuel Feed Loop System</div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", height: "30px" }}>
                  <th style={{ padding: "4px 8px" }}>Parameter</th>
                  <th style={{ padding: "4px 8px" }}>Tag</th>
                  <th style={{ padding: "4px 8px", textAlign: "right" }}>Value</th>
                  <th style={{ padding: "4px 8px", textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>{renderParameterRows(fuelParams)}</tbody>
            </table>
          </div>
        </div>

        {/* Panel 3: Reactor Cooling & Level System */}
        {/* source: WS /ws/telemetry -> reactor.core_temp, reactor.core_pressure, reactor.coolant_flow, reactor.coolant_temp, reactor.vessel_level */}
        <div className="isa-panel" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <div className="isa-panel-header">Reactor Cooling & Level System</div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", height: "30px" }}>
                  <th style={{ padding: "4px 8px" }}>Parameter</th>
                  <th style={{ padding: "4px 8px" }}>Tag</th>
                  <th style={{ padding: "4px 8px", textAlign: "right" }}>Value</th>
                  <th style={{ padding: "4px 8px", textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>{renderParameterRows(waterParams)}</tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
export default PlantOperation;
