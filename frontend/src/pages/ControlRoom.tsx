import React, { useState } from "react";
import { useTelemetry } from "../context/TelemetryContext";
import { ProcessFlowAnimator } from "../components/ProcessFlowAnimator";

export const ControlRoom: React.FC = () => {
  const { telemetry, authToken } = useTelemetry();

  const [tempInput, setTempInput] = useState("");
  const [rpmInput, setRpmInput] = useState("");
  const [pressInput, setPressInput] = useState("");
  const [fuelPressInput, setFuelPressInput] = useState("");
  const [estopReason, setEstopReason] = useState("Control Room Manual E-STOP");
  const [isLoading, setIsLoading] = useState(false);

  if (!telemetry) {
    return (
      <div className="no-scroll-container">
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "20px" }}>Awaiting telemetry...</div>
      </div>
    );
  }

  const { setpoints, actuators, estop_active } = telemetry;

  const handleApplySetpoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload: Record<string, number> = {};
      if (tempInput) payload["target_temp"] = parseFloat(tempInput);
      if (rpmInput) payload["target_rpm"] = parseFloat(rpmInput);
      if (pressInput) payload["target_pressure"] = parseFloat(pressInput);
      if (fuelPressInput) payload["target_fuel_pressure"] = parseFloat(fuelPressInput);

      const response = await fetch("http://localhost:8000/api/v1/control/setpoints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setTempInput("");
        setRpmInput("");
        setPressInput("");
        setFuelPressInput("");
        alert("Target setpoints modified successfully.");
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail?.message || "Failed to update setpoints."}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActuator = async (name: string, currentState: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/control/actuator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify({
          actuator_name: name,
          state: !currentState,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(`Error: ${err.detail?.message || "Failed to toggle actuator."}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerEstop = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/control/estop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify({
          operator: localStorage.getItem("argus_username") || "OPERATOR",
          reason: estopReason,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(`Error: ${err.detail?.message || "Failed to trigger E-STOP."}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSystem = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/system/reset", {
        method: "POST",
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
      });

      if (!response.ok) {
        const err = await response.json();
        alert(`Error: ${err.detail?.message || "Failed to reset system."}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="no-scroll-container" style={{ height: "100%" }}>
      <main
        className="no-scroll-content"
        style={{
          gridTemplateColumns: "1.3fr 1fr",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* LEFT COLUMN: P&ID Live Process Mimic */}
        <ProcessFlowAnimator telemetry={telemetry} />

        {/* RIGHT COLUMN: Supervisory Control Console panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", paddingRight: "4px" }}>
          {/* Actuator override controls */}
          {/* source: WS /ws/telemetry -> actuators */}
          {/* source: POST /api/v1/control/actuator */}
          <div className="isa-panel" style={{ flexShrink: 0 }}>
            <div className="isa-panel-header">Discrete Actuator Overrides</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              {Object.entries(actuators).map(([key, act]) => (
                <div
                  key={key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    backgroundColor: "rgba(255,255,255,0.01)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "3px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontWeight: "bold", fontSize: "0.8rem", textTransform: "capitalize" }}>
                      {key.replace("_", " ")}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                      Modbus Target: {act.modbus_address}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleActuator(key, act.state)}
                    disabled={isLoading || estop_active}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: act.state ? "rgba(14, 165, 233, 0.15)" : "transparent",
                      border: `1px solid ${act.state ? "var(--color-flow-cyan)" : "var(--border-color)"}`,
                      color: act.state ? "var(--color-flow-cyan)" : "var(--text-muted)",
                      borderRadius: "3px",
                      fontWeight: "bold",
                      fontSize: "0.7rem",
                      cursor: "pointer",
                    }}
                  >
                    {act.formatted}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Process Setpoint Overrides */}
          {/* source: WS /ws/telemetry -> setpoints */}
          {/* source: POST /api/v1/control/setpoints */}
          <div className="isa-panel" style={{ flexShrink: 0 }}>
            <div className="isa-panel-header">Process Setpoint Overrides</div>
            <form onSubmit={handleApplySetpoints} style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    CORE TEMP TARGET ({setpoints.target_temp.formatted})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempInput}
                    onChange={(e) => setTempInput(e.target.value)}
                    placeholder="e.g. 75.0"
                    style={{
                      padding: "6px",
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                      borderRadius: "3px",
                      fontSize: "0.75rem",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    TURBINE RPM TARGET ({setpoints.target_rpm.formatted})
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={rpmInput}
                    onChange={(e) => setRpmInput(e.target.value)}
                    placeholder="e.g. 3000"
                    style={{
                      padding: "6px",
                      backgroundColor: "var(--bg-primary)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-primary)",
                      borderRadius: "3px",
                      fontSize: "0.75rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading || estop_active}
                style={{
                  padding: "8px",
                  backgroundColor: "var(--color-flow-cyan)",
                  color: "var(--bg-primary)",
                  border: "none",
                  borderRadius: "3px",
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  marginTop: "4px",
                }}
              >
                APPLY SUPERVISORY SETPOINTS
              </button>
            </form>
          </div>

          {/* SCRAM E-STOP trigger */}
          {/* source: WS /ws/telemetry -> estop_active */}
          {/* source: POST /api/v1/control/estop */}
          <div
            className="isa-panel"
            style={{
              flexShrink: 0,
              backgroundColor: "rgba(239, 68, 68, 0.03)",
              border: "1px solid var(--color-alarm-critical)",
            }}
          >
            <div className="isa-panel-header" style={{ color: "var(--color-alarm-critical)", borderBottomColor: "rgba(239, 68, 68, 0.2)" }}>
              SAFETY SCRAM INTERLOCK TRIGGER
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
              <input
                type="text"
                value={estopReason}
                onChange={(e) => setEstopReason(e.target.value)}
                placeholder="Actuation Reason"
                style={{
                  padding: "6px",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "var(--text-primary)",
                  borderRadius: "3px",
                  fontSize: "0.75rem",
                  outline: "none",
                }}
              />
              <button
                onClick={handleTriggerEstop}
                disabled={isLoading || estop_active}
                style={{
                  padding: "10px",
                  backgroundColor: "var(--color-alarm-critical)",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                {estop_active ? "PLANT SCRAM ENGAGED" : "TRIGGER EMERGENCY STOP SCRAM"}
              </button>
            </div>
          </div>

          {/* Reset options */}
          {/* source: POST /api/v1/system/reset */}
          <div className="isa-panel" style={{ flexShrink: 0 }}>
            <div className="isa-panel-header">Admin System Reset Options</div>
            <button
              onClick={handleResetSystem}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "transparent",
                border: "1px solid var(--color-flow-cyan)",
                color: "var(--color-flow-cyan)",
                borderRadius: "3px",
                fontWeight: "bold",
                fontSize: "0.75rem",
                cursor: "pointer",
                marginTop: "6px",
              }}
            >
              CLEAR PLANT TRIPS & RESET SYSTEM STATE
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
export default ControlRoom;
