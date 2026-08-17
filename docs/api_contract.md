# Argus API Contract & Frontend Binding Specifications
**Document Reference:** `docs/api_contract.md`  
**Target Consumer:** Phase 3 Operator Workstation (OWS) & OT SOC Frontend Developers  
**Base URL:** `http://localhost:8000/api/v1`  
**WebSocket URL:** `ws://localhost:8000/ws/telemetry`  

---

## 1. Authentication & Role-Based Access Control (RBAC)

All write operations require a **JWT Bearer Token** passed in the HTTP Authorization header:
`Authorization: Bearer <JWT_TOKEN>`

### Pre-Configured Users (For Testing / Demo)

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin` | `adminpassword` | `ADMINISTRATOR` | Full control, setpoints, E-STOP, alarm shelving, attack simulation, reset. |
| `operator` | `operatorpassword` | `OPERATOR` | Plant control, setpoint adjustments, E-STOP, alarm ack/shelve. |
| `auditor` | `auditorpassword` | `AUDITOR` | Read-Only. Write attempts trigger **ALM-007** & auto-log to SOC threat stream. |

---

## 2. 10Hz WebSocket Telemetry Push Contract

**Endpoint:** `ws://localhost:8000/ws/telemetry`  
**Frequency:** 10Hz ($\Delta t = 0.1\text{ s}$)  
**Backend Processing:** Every numeric value is supplied with both a `raw` float and a pre-formatted string (`formatted`), an evaluated server-side status (`"normal"`, `"warning"`, `"critical"`, `"scram"`), and an ISA-101 compliant color token (`status_color`). The frontend must render these values directly without client-side calculation.

```json
{
  "timestamp": "2026-07-21T15:41:21.100Z",
  "system_status": "NORMAL",
  "estop_active": false,
  "deception_active": false,
  "reactor": {
    "fuel_pressure": {
      "raw": 4.20,
      "formatted": "4.20 bar",
      "status": "normal",
      "status_color": "#0EA5E9",
      "unit": "bar"
    },
    "fuel_flow": {
      "raw": 17.64,
      "formatted": "17.64 L/min",
      "status": "normal",
      "status_color": "#0EA5E9",
      "unit": "L/min"
    },
    "core_temp": {
      "raw": 72.40,
      "formatted": "72.4 °C",
      "status": "normal",
      "status_color": "#F8FAFC",
      "unit": "°C"
    },
    "core_pressure": {
      "raw": 2.40,
      "formatted": "2.40 bar",
      "status": "normal",
      "status_color": "#F8FAFC",
      "unit": "bar"
    },
    "steam_temp": {
      "raw": 145.2,
      "formatted": "145.2 °C",
      "status": "normal",
      "status_color": "#F8FAFC",
      "unit": "°C"
    },
    "steam_pressure": {
      "raw": 5.80,
      "formatted": "5.80 bar",
      "status": "normal",
      "status_color": "#F8FAFC",
      "unit": "bar"
    },
    "turbine_torque": {
      "raw": 1056.0,
      "formatted": "1056 N·m",
      "status": "normal",
      "status_color": "#0EA5E9",
      "unit": "N·m"
    },
    "turbine_rpm": {
      "raw": 3000.0,
      "formatted": "3000 RPM",
      "status": "normal",
      "status_color": "#0EA5E9",
      "unit": "RPM"
    },
    "generator_output": {
      "raw": 98.2,
      "formatted": "98.2 %",
      "status": "normal",
      "status_color": "#0EA5E9",
      "unit": "%"
    },
    "electrical_power": {
      "raw": 49.1,
      "formatted": "49.1 MW",
      "status": "normal",
      "status_color": "#0EA5E9",
      "unit": "MW"
    },
    "coolant_flow": {
      "raw": 45.0,
      "formatted": "45.0 L/min",
      "status": "normal",
      "status_color": "#0EA5E9",
      "unit": "L/min"
    },
    "coolant_temp": {
      "raw": 28.5,
      "formatted": "28.5 °C",
      "status": "normal",
      "status_color": "#F8FAFC",
      "unit": "°C"
    },
    "vessel_level": {
      "raw": 65.0,
      "formatted": "65.0 %",
      "status": "normal",
      "status_color": "#0EA5E9",
      "unit": "%"
    }
  },
  "setpoints": {
    "target_rpm": {"raw": 3000.0, "formatted": "3000 RPM"},
    "target_temp": {"raw": 75.0, "formatted": "75.0 °C"},
    "target_pressure": {"raw": 2.5, "formatted": "2.50 bar"}
  },
  "actuators": {
    "fuel_valve": {"state": true, "formatted": "OPEN", "modbus_address": "%QX0.0"},
    "coolant_pump": {"state": true, "formatted": "RUNNING", "modbus_address": "%QX0.1"},
    "heater_jacket": {"state": true, "formatted": "ENGAGED", "modbus_address": "%QX0.2"},
    "relief_valve": {"state": false, "formatted": "CLOSED", "modbus_address": "%QX0.3"}
  },
  "alarms": {
    "active_count": 0,
    "unack_count": 0,
    "highest_severity": "NORMAL",
    "list": [
      {
        "id": "ALM-001",
        "tag": "TT-101",
        "name": "Core High-High Temperature Trip",
        "priority": 1,
        "priority_label": "CRITICAL",
        "color_hex": "#EF4444",
        "state": "NORMAL",
        "timestamp": "2026-07-21T15:41:21.100Z",
        "message": "Core temp within limits",
        "value_formatted": "72.4 °C"
      }
    ]
  },
  "security": {
    "cusum_score": 0.0,
    "fdi_detected": false,
    "last_attacker_ip": "127.0.0.1",
    "intercepted_payloads_count": 0,
    "active_mitre_techniques": ["T0801"],
    "attack_chain_step": "Reconnaissance"
  }
}
```

---

## 3. REST API Specification

### Auth Endpoints
* **`POST /api/v1/auth/login`**: Authenticate user and receive JWT.
  - **Body**: `{"username": "operator", "password": "operatorpassword"}`
  - **Response**: `{"access_token": "...", "token_type": "bearer", "role": "OPERATOR", "user_name": "..."}`
* **`GET /api/v1/auth/me`**: Get authenticated profile info.

### Control Endpoints (Requires `OPERATOR` or `ADMINISTRATOR` token)
* **`POST /api/v1/control/estop`**: Trigger Emergency Stop SCRAM.
  - **Body**: `{"operator": "operator", "reason": "High vibration detected"}`
* **`POST /api/v1/control/setpoints`**: Update setpoints.
  - **Body**: `{"target_rpm": 3200.0, "target_temp": 80.0}`
* **`POST /api/v1/control/actuator`**: Toggle valve or pump state.
  - **Body**: `{"actuator_name": "fuel_valve", "state": false}`

### ISA-18.2 Alarm Management Endpoints
* **`POST /api/v1/alarms/acknowledge`**: `{"alarm_id": "ALM-001"}`
* **`POST /api/v1/alarms/shelve`**: `{"alarm_id": "ALM-001", "duration_minutes": 30, "reason": "Maintenance"}`
* **`POST /api/v1/alarms/clear`**: `{"alarm_id": "ALM-001"}`

### Attack Simulation Endpoints (For Attack Monitoring Center)
* **`GET /api/v1/simulation/scenarios`**: Retrieve available attack scenarios.
* **`POST /api/v1/simulation/start`**: Start attack simulation timeline with animation cues.
  - **Body**: `{"scenario_id": "fdi_injection", "attacker_ip": "192.168.1.105"}`
* **`POST /api/v1/simulation/stop`**: Stop active attack simulation.
* **`GET /api/v1/simulation/active`**: Retrieve live step-by-step kill-chain timeline.
* **`POST /api/v1/simulation/attack`**: Direct False Data Injection write test frame.

### Security & MITRE Threat Intelligence Endpoints
* **`GET /api/v1/security/events`**: Query historical threat logs from SQLite WAL.
* **`GET /api/v1/mitre/techniques`**: Query 21+ technique registry & active attack chain phase.
* **`POST /api/v1/system/reset`**: Reset E-STOP and clear deception state back to normal baseline.

---

## 4. Complete OpenAPI 3.0 Schema Export

```json
{
  "openapi": "3.0.2",
  "info": {
    "title": "Argus Cyber-Physical Backend API",
    "version": "1.0.0",
    "description": "Process-Aware OT Deception & Digital Twin Cyber Defense Backend API Schema"
  },
  "paths": {
    "/api/v1/auth/login": {
      "post": {
        "summary": "Authenticate OT User",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "username": {"type": "string", "example": "operator"},
                  "password": {"type": "string", "example": "operatorpassword"}
                },
                "required": ["username", "password"]
              }
            }
          }
        },
        "responses": {
          "200": {"description": "JWT Token generated successfully"},
          "401": {"description": "Invalid credentials"}
        }
      }
    },
    "/api/v1/telemetry": {
      "get": {
        "summary": "Get Pre-Formatted Telemetry Snapshot",
        "responses": {
          "200": {"description": "Display-ready JSON object"}
        }
      }
    },
    "/api/v1/control/estop": {
      "post": {
        "summary": "Trigger Emergency Stop (SCRAM)",
        "security": [{"bearerAuth": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "operator": {"type": "string", "default": "OPERATOR_CONSOLE"},
                  "reason": {"type": "string", "default": "Manual Emergency Trip Initiated"}
                }
              }
            }
          }
        },
        "responses": {
          "200": {"description": "SCRAM engaged successfully"},
          "403": {"description": "Forbidden - Read-only user (ALM-007 triggered)"}
        }
      }
    },
    "/api/v1/simulation/start": {
      "post": {
        "summary": "Start Attack Scenario Simulation Timeline",
        "security": [{"bearerAuth": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "scenario_id": {"type": "string", "example": "fdi_injection"},
                  "attacker_ip": {"type": "string", "default": "192.168.1.105"}
                },
                "required": ["scenario_id"]
              }
            }
          }
        },
        "responses": {
          "200": {"description": "Scenario timeline started"}
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
}
```
