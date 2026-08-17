# Technical Research Brief & Architectural Foundation
**Project Name:** Argus (Process-Aware OT Deception & Digital Twin Framework)  
**Document Reference:** `A:\Project-IX\Argus\docs\research_brief.md`  
**Classification:** Operational Technology Security Research & System Specifications  

---

## Executive Summary
This document establishes the technical groundwork for **Project Argus**, an active cyber defense and process-aware deception system for Operational Technology (OT) and Industrial Control Systems (ICS). Grounded in physics-based intrusion detection, modern industrial human-factor standards, and real-time digital twin thermodynamic modeling, this brief translates theoretical domain standards into concrete software engineering specifications.

---

## Section 1: MITRE ATT&CK for ICS (Technique Categorization & Mapping)

The MITRE ATT&CK for ICS framework categorizes adversary tactics and techniques across industrial control networks. The table below details the full current technique list structured by the 12 core tactics, noting severity and primary affected asset types.

### 1. Reconnaissance
| Technique ID | Technique Name | Short Description | Severity | Affected Asset Type |
| :--- | :--- | :--- | :--- | :--- |
| **T0888** | Remote System Info Discovery | Probing OT networks to identify live hosts, protocols, and device models. | Low | Control Network, EWS, OWS |
| **T0846** | Wireless Footprinting | Scanning industrial wireless spectrums (802.15.4, ISA100.11a, WirelessHART). | Low | Wireless Gateways, Field Sensors |
| **T0801** | Monitor Process State | Passively sniffing or actively polling registers to map normal process baselines. | Medium | PLCs, RTUs, HMI |

### 2. Initial Access
| Technique ID | Technique Name | Short Description | Severity | Affected Asset Type |
| :--- | :--- | :--- | :--- | :--- |
| **T0865** | Spearphishing Attachment | Delivering malicious payloads via email to engineering staff to breach IT/OT boundary. | High | Enterprise IT, EWS |
| **T0886** | Remote Services | Exploiting compromised RDP, VNC, or VPN connections into the Level 2/3 network. | High | Jump Hosts, EWS, OWS |
| **T0862** | Supply Chain Compromise | Tampering with third-party software, PLC programming IDEs, or field hardware. | Critical | PLCs, RTUs, EWS |
| **T0847** | Removable Media Replication | Utilizing infected USB drives to bypass air-gapped physical perimeters (Stuxnet vector). | High | Air-gapped EWS, Soft-PLCs |
| **T0819** | Exploit Public Application | Exploiting vulnerabilities in web-accessible OT portals (e.g., OpenPLC HTTP port 8080). | High | Web Gateways, Soft-PLCs |

### 3. Execution
| Technique ID | Technique Name | Short Description | Severity | Affected Asset Type |
| :--- | :--- | :--- | :--- | :--- |
| **T0823** | API / Scripting Execution | Executing malicious Python, PowerShell, or Bash scripts on control servers. | High | OWS, EWS, Host OS |
| **T0834** | Native API | Calling low-level OS or driver APIs to interact directly with hardware interfaces. | Medium | Control Servers |
| **T0853** | Command-Line Interface | Invoking CLI shells to execute arbitrary system commands on OT nodes. | High | EWS, OWS, Soft-PLC host |
| **T0871** | Execution via Programmed Logic | Executing unauthorized IEC 61131-3 logic cycles compiled on the target PLC. | Critical | PLCs |

### 4. Persistence
| Technique ID | Technique Name | Short Description | Severity | Affected Asset Type |
| :--- | :--- | :--- | :--- | :--- |
| **T0839** | Module Firmware | Flashing malicious bootloaders or firmware onto controllers to maintain low-level persistence. | Critical | PLCs, RTUs, IEDs |
| **T0889** | Modify Programmed Logic | Altering Ladder Logic or Structured Text to execute hidden backdoor triggers. | Critical | PLCs |
| **T0858** | Valid Accounts | Utilizing stolen legitimate operational or administrative credentials across OT nodes. | High | OWS, Domain Controllers |
| **T0873** | Hardcoded Credentials | Exploiting factory default passwords left enabled on industrial network gear. | High | PLCs, Managed Switches |

### 5. Evasion
| Technique ID | Technique Name | Short Description | Severity | Affected Asset Type |
| :--- | :--- | :--- | :--- | :--- |
| **T0820** | Exploit Victim Architecture | Crafting packets that abuse protocol parser quirks to bypass Deep Packet Inspection (DPI). | High | OT Firewalls, IDSs |
| **T0849** | Rogue Master / Slave | Spoofing an authorized HMI IP address or PLC node to issue unauthenticated commands. | High | SCADA Master, PLCs |
| **T0870** | Masquerading | Naming malicious processes after legitimate SCADA services to evade endpoint detection. | Medium | OWS, PB-IDS Daemon |
| **T0857** | System Binary Proxy Execution | Running malicious payloads through trusted industrial utilities or signed binaries. | High | EWS, OWS |

### 6. Discovery
| Technique ID | Technique Name | Short Description | Severity | Affected Asset Type |
| :--- | :--- | :--- | :--- | :--- |
| **T0840** | Network Service Scanning | Sweeping subnets for exposed industrial ports (TCP 502 Modbus, 102 S7, 44818 EtherNet/IP). | Medium | OT Subnets |
| **T0887** | IO Module Discovery | Enumerating attached expansion I/O blocks, analog inputs, and digital output cards. | Medium | PLCs, Modular RTUs |
| **T0802** | Device Identification | Issuing Modbus FC43 (Read Device Identification) to extract vendor, product, and version. | Medium | PLCs, Gateways |

### 7. Lateral Movement
| Technique ID | Technique Name | Short Description | Severity | Affected Asset Type |
| :--- | :--- | :--- | :--- | :--- |
| **T0866** | Exploit Differential Targets | Pivoting across dual-homed machines bridging enterprise IT and OT segments. | High | Dual-homed EWS/OWS |
| **T0843** | Program Download | Pushing compromised project files across the OT network to multiple target controllers. | Critical | PLCs |
| **T0886** | Remote Services Pivot | Re-using administrative credentials to SSH/RDP across Level 2 operator stations. | High | OWS, EWS |

### 8. Collection
| Technique ID | Technique Name | Short Description | Severity | Affected Asset Type |
| :--- | :--- | :--- | :--- | :--- |
| **T0802** | Automated Collection | Harvesting real-time process logs, historical databases, and Modbus memory values. | Medium | Historian, PLCs |
| **T0811** | Info Repository Exploitation | Exfiltrating P&ID diagrams, standard operating procedures, and tag export files. | High | Historian, Shared Drives |
| **T0830** | Man-in-the-Middle (MitM) | Conducting ARP poisoning to position between OWS and PLC to inspect and alter traffic. | Critical | OT Ethernet Switch |

### 9. Command & Control
| Technique ID | Technique Name | Short Description | Severity | Affected Asset Type |
| :--- | :--- | :--- | :--- | :--- |
| **T0884** | Connection Proxy | Routing C2 traffic through compromised Level 2 engineering nodes to mask external IP. | High | Gateways, EWS |
| **T0885** | Commonly Used Port | Encapsulating malicious traffic over standard industrial ports (TCP 502, 8080). | Medium | Perimeter Firewalls |
| **T0869** | Standard Application Protocol | Leveraging Modbus TCP directly as an arbitrary data transport channel. | High | PLCs, Soft-PLCs |

### 10. Inhibit Response Function
| Technique ID | Technique Name | Short Description | Severity | Affected Asset Type |
| :--- | :--- | :--- | :--- | :--- |
| **T0814** | Denial of Service (DoS) | Flooding PLC network interfaces with high-rate polling requests to crash scan cycles. | Critical | PLCs, NICs |
| **T0816** | Alarm Suppression | Disabling hardware interlocks or overwriting alarm limits to blind operators to danger. | Critical | Safety Systems (SIS), HMI |
| **T0838** | Modify Parameter (Safety) | Tampering with safety setpoint registers (e.g., raising MAX_TEMP limit). | Critical | PLCs, Safety Logic |
| **T0806** | Change Operating Mode | Forcing PLC execution state from RUN mode to STOP or PROGRAM mode. | High | PLCs |

### 11. Impair Process Control
| Technique ID | Technique Name | Short Description | Severity | Affected Asset Type |
| :--- | :--- | :--- | :--- | :--- |
| **T0836** | Modify Parameter (Process) | Overwriting process setpoints (e.g., forcing temperature register to 150°C). | Critical | PLCs, Actuators |
| **T0855** | Unauthorized Command Message | Directly issuing Modbus FC05/FC06 write frames to field actuators bypassing logic. | Critical | PLCs, Field Devices |
| **T0831** | Manipulation of Control | Overriding closed-loop PID parameters to induce destructive oscillations. | Critical | PLCs, Control Loops |

### 12. Impact
| Technique ID | Technique Name | Short Description | Severity | Affected Asset Type |
| :--- | :--- | :--- | :--- | :--- |
| **T0826** | Loss of Control | Complete loss of manual and automatic operational oversight over plant machinery. | Critical | Cyber-Physical System |
| **T0828** | Loss of Safety | Disabling safety trip mechanisms leading to vessel over-pressurization or thermal runaway. | Critical | SIS, Physical Plant |
| **T0832** | Manipulation of View | Spoofing normal sensor telemetry to HMI while physical reactor is being destroyed. | Critical | OWS, HMI |
| **T0879** | Property Damage / Destruction | Causing permanent physical damage to reactor vessels, pumps, or heating elements. | Critical | Physical Capital Assets |

---

## Section 2: ISA-101 HMI Design Standard (High-Performance HMI)

The **ANSI/ISA-101.01-2015** standard (*Human Machine Interfaces for Process Automation Systems*) provides guidelines for designing interfaces that minimize operator cognitive load and enhance situational awareness.

### 1. Core Philosophy & Anti-Patterns
* **High-Performance Paradigm**: Interfaces must prioritize operational clarity over aesthetic embellishment.
* **Prohibited Elements**: 3D graphics, gradient fills, drop shadows, spinning agitator animations, realistic vessel textures, and bright decorative colors.
* **Goal**: Enable operators to detect process anomalies within **less than 5 seconds** of viewing any screen.

### 2. Color Palette Specs (Dark Theme Specification)
To eliminate control room glare and visual fatigue, ISA-101 defines strict color utility:

| Component Category | Hex Code | Visual Designation | Usage & Context |
| :--- | :--- | :--- | :--- |
| **Primary Background** | `#0B0F19` | Deep Matte Navy/Slate | Full screen background; non-reflective. |
| **Card / Panel Surface** | `#151D2A` | Dark Matte Charcoal | Container background for process units. |
| **Borders & Dividers** | `#1E293B` | Low-Contrast Grey | Structural outlines; subtle separation. |
| **Primary Text / Values** | `#F8FAFC` | High-Contrast Off-White | Live sensor readouts, engineering units. |
| **Muted Text / Labels** | `#64748B` | Slate Grey | Static tag labels (`TT-101`), static text. |
| **Inactive Equipment** | `#475569` | Dark Grey | Closed valves, de-energized heaters/pumps. |
| **Active Flow / Material** | `#0EA5E9` | Muted Cyan / Cool Blue | Active piping, running agitator motor. |
| **Alarm: Priority 1 (Critical)**| `#EF4444` | High-Contrast Red | Physical emergency, active FDI attack. |
| **Alarm: Priority 2 (High)** | `#F97316` | Amber / Orange | Safety threshold violation, near limit. |
| **Alarm: Priority 3 (Medium)**| `#EAB308` | Industrial Yellow | Minor process deviation. |
| **Alarm: Priority 4 (Low)** | `#06B6D4` | Soft Cyan | System state change, informational. |

### 3. Layout Hierarchy (4-Level Structure)
1. **Level 1 (Overview Display)**: Whole-plant summary. Displays key performance metrics, overall alarm banners, and high-level risk state.
2. **Level 2 (Process Unit Control)**: Primary operating screen. Contains the Process Flow Diagram (PFD) for specific units (e.g., Unit-03 Chemical Reactor), primary controls, and real-time trend charts.
3. **Level 3 (Sub-system Detail)**: Interlock logic diagrams, controller tuning (PID parameters), diagnostic sub-menus.
4. **Level 4 (Diagnostic & Security Summary)**: Detailed alarm logs, system event history, and active threat intelligence feeds.

### 4. Visual Display Rules
* **Analog Values**: Never display raw floating numbers in isolation. Pair every value with engineering units and an analog range indicator (e.g., `45.2 °C [20.0 ---|--- 80.0]`).
* **Alarm Banding**: Bar gauges must visually demarcate safe operating zones (grey) from High (amber) and High-High (red) alarm bands.
* **Contrast Compliance**: Text-to-background contrast must strictly exceed **4.5:1** (WCAG 2.1 AA standard), with critical alarm indicators achieving **> 7:1**.

---

## Section 3: ISA-18.2 Alarm Management Standard

The **ANSI/ISA-18.2-2016** standard (*Management of Alarm Systems for the Process Industries*) defines the lifecycle, states, and prioritization framework for industrial alarms.

### 1. Alarm State Machine Lifecycle
An industrial alarm must transition strictly through predefined states:

```
                  +-------------------+
                  |      NORMAL       |
                  +-------------------+
                    |               ^
   Process Exceeds  |               |  Process Normal &
   Threshold        v               |  Acknowledged
                  +-------------------+
                  |  UNACKNOWLEDGED   |  (Flashing visual + Audible)
                  +-------------------+
                    |               |
     Operator Press |               |  Process Returns Normal
     ACK Button     v               v  Before ACK
                  +-------------------+
                  |   ACKNOWLEDGED    |  (Steady Alarm Color)
                  +-------------------+
                    |
     Process Returns|
     Normal         v
                  +-------------------+
                  |      NORMAL       |
                  +-------------------+
```

* **Shelved State**: Operator manually suppresses an alarm for a controlled time window (e.g., during scheduled maintenance).
* **Suppressed State**: Logic automatically silences downstream derivative alarms during a plant trip (SCRAM) to prevent alarm floods.

### 2. Alarm Priority Tiers

| Priority Tier | Designation | Color Code | Max Response Time | Target Frequency | Operational Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Priority 1** | **CRITICAL** | `#EF4444` (Red) | `< 1 minute` | `< 5%` of total | Imminent physical danger, vessel burst, active FDI injection. Immediate shutdown or intervention required. |
| **Priority 2** | **HIGH** | `#F97316` (Orange)| `1 - 5 minutes` | `~15%` of total | Major process deviation, automatic safety trip imminent if uncorrected. |
| **Priority 3** | **MEDIUM** | `#EAB308` (Yellow)| `5 - 30 minutes` | `~30%` of total | Minor deviation from baseline setpoint; operational correction required. |
| **Priority 4** | **LOW / INFO**| `#06B6D4` (Cyan) | `No deadline` | `~50%` of total | Process state change, manual valve toggle, routine operational log. |

### 3. Alarm Performance Metrics
* **Normal Operation**: `< 15 alarms per operator per hour`.
* **Alarm Flood Limit**: `> 10 alarms in a 10-minute window` constitutes an Alarm Flood, triggering automatic alarm suppression routines.

---

## Section 4: Modbus TCP Protocol Structure

Modbus TCP encapsulates standard Modbus Application Protocol (MBAP) frames inside TCP/IP packets operating over **Port 502**.

### 1. MBAP Header Frame Breakdown (7 Bytes)
Unlike serial Modbus RTU, Modbus TCP omits CRC16 checksums, relying on TCP layer checksums for data integrity.

```
+--------------------+--------------------+--------------------+--------------------+
|  Transaction ID    |    Protocol ID     |   Length Field     |      Unit ID       |
|    (Bytes 0 - 1)   |    (Bytes 2 - 3)   |    (Bytes 4 - 5)   |      (Byte 6)      |
+--------------------+--------------------+--------------------+--------------------+
|  Sequence Sync     |  Always 0x0000     | Byte Count Remaining| 0x01 or 0xFF       |
+--------------------+--------------------+--------------------+--------------------+
```

### 2. Core Modbus Function Codes

| Function Code | Hex | Name | Data Type | Operation | Max Query Range |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FC01** | `0x01` | Read Coils | Discrete Output (Boolean) | Read | 1 to 2000 points |
| **FC02** | `0x02` | Read Discrete Inputs | Discrete Input (Boolean) | Read-Only | 1 to 2000 points |
| **FC03** | `0x03` | Read Holding Registers | 16-bit Unsigned Integer | Read/Write | 1 to 125 registers |
| **FC04** | `0x04` | Read Input Registers | 16-bit Unsigned Integer | Read-Only | 1 to 125 registers |
| **FC05** | `0x05` | Write Single Coil | Discrete Output (Boolean) | Write (`0xFF00`=ON, `0x0000`=OFF) | 1 point |
| **FC06** | `0x06` | Write Single Register | 16-bit Unsigned Integer | Write (`0x0000` - `0xFFFF`) | 1 register |
| **FC16** | `0x10` | Write Multiple Registers| 16-bit Unsigned Integers | Write Block | 1 to 123 registers |
| **FC43** | `0x2B` | Read Device ID | ASCII String Descriptor | Read Identification | Vendor / Product Specs |

### 3. Modbus Memory Mapping Architecture
Industrial memory tables correlate standard IEC 61131-3 notation with Modbus register addresses:

```
Modbus Memory Table:
- Discrete Coils (%QX): 0x0000 to 0x9999  (Read/Write Booleans)
- Discrete Inputs (%IX): 1x0000 to 1x9999 (Read-Only Booleans)
- Input Registers (%IW): 3x0000 to 3x9999 (Read-Only 16-bit Integers)
- Holding Registers (%QW): 4x0000 to 4x9999 (Read/Write 16-bit Integers)
```

---

## Section 5: P&ID Symbol Standards (ANSI/ISA-5.1)

The **ANSI/ISA-5.1-2009** standard (*Instrumentation Symbols and Identification*) defines tag naming conventions and line symbols for Piping and Instrumentation Diagrams (P&ID).

### 1. Tag Identification Convention
Tags follow a structured alphanumeric format: `[First Letter(s)][Succeeding Letter(s)] - [Loop Number]`

#### First Letter (Measured / Initiating Variable)
* `T`: Temperature
* `P`: Pressure
* `L`: Level
* `F`: Flow
* `A`: Analysis (pH, Conductivity, Concentration)
* `M`: Motor / Mechanical Drive
* `V` / `X`: Valve / Special Mechanical Actuator

#### Succeeding Letters (Readout or Output Function)
* `T`: Transmitter (converts sensor reading to electrical signal)
* `I`: Indicator (local visual gauge / display)
* `C`: Controller (automatic feedback control unit)
* `V`: Valve (control valve body)
* `S`: Switch (discrete threshold trigger)
* `A`: Alarm (high/low warning indicator)
* `E`: Element (raw sensing probe, e.g. PT100 RTD)

### 2. Unit-03 Reactor Equipment Tag List

| Tag Identifier | Device Description | P&ID Function | Signal Type | Range / Unit |
| :--- | :--- | :--- | :--- | :--- |
| `TT-101` | Reactor Fluid Temp Transmitter | Temperature Probe (PT100) | Analog Input | `0.0 °C to 200.0 °C` |
| `PT-101` | Vessel Headspace Pressure | Pressure Transducer | Analog Input | `0.00 to 10.00 bar` |
| `LT-101` | Reactor Liquid Level | Guided Wave Radar Transducer | Analog Input | `0.0% to 100.0%` |
| `FT-101` | Reactant Inlet Flow Rate | Electromagnetic Flow Meter | Analog Input | `0.0 to 50.0 L/min` |
| `V-101` (`XV-101`)| Inlet Feed Solenoid Valve | Discrete On/Off Feed Control | Digital Output | `0: Closed, 1: Open` |
| `V-102` (`XV-102`)| Discharge Product Valve | Discrete On/Off Drain Control | Digital Output | `0: Closed, 1: Open` |
| `RV-101` | Emergency Relief / SCRAM Valve | Pressure Relief Safety Valve | Digital Output | `0: Closed, 1: Open` |
| `M-201` (`MXR-101`)| Reactor Agitator Motor | Mechanical Mixing Drive | Digital Output | `0: Off, 1: On` |
| `HTR-101` (`H-301`)| Heating Element Jacket | Electrical Heating Coil | Digital Output | `0: Off, 1: On` |

---

## Section 6: Physics Modeling for Nuclear/Chemical Reactor Digital Twin

To construct a high-fidelity Digital Twin that evades threat-actor fingerprinting, the backend physics daemon (`reactor_sim.py`) models continuous-time thermodynamics and kinematics using numerical differential equations.

### 1. Differential Thermal Model (Continuous-Stirred Tank Reactor)
The temperature change of fluid inside the reactor vessel is governed by Newton's Law of Cooling coupled with energy input and fluid mass balance:

$$\frac{dT}{dt} = \frac{1}{m(t) \cdot c_p} \left[ Q_{in} \cdot C_{heater}(t) + F_{in}(t) \cdot \rho \cdot c_p \cdot (T_{inlet} - T(t)) - U \cdot A \cdot (T(t) - T_{env}) \right]$$

Where:
* $T(t)$: Current reactor fluid temperature (°C)
* $Q_{in}$: Nominal heating element power capacity ($10,000\text{ Watts} = 10\text{ kW}$)
* $C_{heater}(t) \in \{0, 1\}$: Binary state of Modbus heating coil (`%QX0.2`)
* $F_{in}(t)$: Volumetric inlet flow rate ($\text{m}^3/\text{s}$), active when `V-101` (`%QX0.0`) is open
* $m(t)$: Liquid mass within reactor ($\text{kg}$), updated via mass flow rate $\frac{dm}{dt} = \rho (F_{in} - F_{out})$
* $c_p$: Specific heat capacity of fluid ($\approx 4,184\text{ J/(kg·°C)}$ for water)
* $\rho$: Fluid density ($\approx 1,000\text{ kg/m}^3$)
* $U \cdot A$: Vessel heat transfer coefficient times surface area ($\approx 25.0\text{ W/°C}$)
* $T_{inlet}$: Temperature of incoming feed chemical ($\approx 20.0\text{ °C}$)
* $T_{env}$: Ambient room temperature ($\approx 25.0\text{ °C}$)

### 2. Kinematic Pressure & Headspace Coupling
Vessel pressure is coupled to thermal expansion and gas accumulation using the Ideal Gas Law:

$$P(t) = P_{atm} + \frac{n \cdot R \cdot (T(t) + 273.15)}{V_{headspace}(t)} + \Delta P_{vapor}(T)$$

Where $V_{headspace}(t) = V_{total} - V_{fluid}(t)$. As temperature $T(t)$ increases or liquid level rises, internal pressure $PT-101$ increases proportionally and deterministically.

### 3. Forward Euler Numerical Integration & Sensor Jitter
The physics loop updates physical states in real time at a fixed scan rate ($\Delta t = 0.1\text{ s}$ = $10\text{ Hz}$):

$$T(t + \Delta t) = T(t) + \left( \frac{dT}{dt} \right) \cdot \Delta t + \epsilon$$

Where $\epsilon \sim \mathcal{N}(0, \sigma^2)$ with $\sigma = 0.15\text{ °C}$ is a Gaussian stochastic noise variable representing Analog-to-Digital Converter (ADC) conversion jitter in hardware RTD sensors.

### 4. Safety Interlocks & SCRAM Logic
```
IF TT-101 > 90.0 °C (High-High Temp):
    FORCE HTR-101 = FALSE (%QX0.2 = 0)  [Trip Heater]
    FORCE RV-101  = TRUE  (%QX0.3 = 1)  [Open Emergency Vent]
    RAISE Alarm Priority 1 (CRITICAL)

IF PT-101 > 8.0 bar (High-High Pressure):
    FORCE V-101   = FALSE (%QX0.0 = 0)  [Isolate Inlet]
    FORCE RV-101  = TRUE  (%QX0.3 = 1)  [Relieve Pressure]
    RAISE Alarm Priority 1 (CRITICAL)

IF LT-101 < 10.0 % (Low-Low Level):
    INHIBIT HTR-101 = TRUE             [Prevent Dry Element Burnout]
```

---

## Section 7: Structural & Architectural Extraction from Reference Report
*Reference Document: "Digital Twins for Active Cyber Defense in Industrial Control Systems" (B. Senapati, NFSU)*

### 1. CUSUM Detection Heuristic & Microsecond Active Deception
The report specifies a Physics-Based Intrusion Detection System (`ot_ids.py`) that monitors Modbus holding registers and enforces physical laws to detect False Data Injection (FDI) attacks.

#### Detection Math
* **Max Physical Thermal Limit**: The $10\text{ kW}$ heating jacket can physically raise temperature by at most **$2.5\text{ °C/sec}$** ($0.25\text{ °C}$ per $100\text{ ms}$ scan loop).
* **Instantaneous Jump Threshold**: If $|T_{current} - T_{t-1}| > 0.25\text{ °C}$ within a single $100\text{ ms}$ cycle, the payload is flagged as an impossible physical jump.
* **CUSUM Statistic for Slow Drift**:
  $$S_k = \max(0, S_{k-1} + (\Delta T_k - \omega_{drift}))$$
  Flags persistent low-amplitude injections that attempt to stay just below peak delta thresholds.

#### Microsecond Active Deception Timeline
When an FDI attack is flagged (e.g., attacker injects $150.0\text{ °C}$ into holding register `%QW0.0`), the system executes a Mutex-locked active deception sequence:

```
  Attacker                Modbus Server (%QW0.0)         PB-IDS (ot_ids.py)         SQLite DB (WAL)
     |                             |                             |                          |
t=0ms|-- Write 150.0°C (FC06) ---->|                             |                          |
     |                             |-- Read Register (150°C) --->|                          |
t=15ms                             |                             |-- Evaluate CUSUM Jump    |
     |                             |                             |   (Flag FDI Attack)      |
t=20ms                             |                             |-- ASYNC Log Attack ----->|
t=30ms                             |                             |-- Calculate Fake Safe Val|
     |                             |                             |   (e.g., 46.5°C)         |
t=40ms                             |<-- Write 46.5°C (FC06) -----|                          |
     |                             |    [OVERWRITE COMPLETE]     |                          |
t=100ms<-- Read Verification ------|                             |                          |
     |     (Returns 46.5°C)        |                             |                          |
     v                             v                             v                          v
```
* **Result**: The attacker receives confirmation of $46.5\text{ °C}$, trapped in an **"Illusion of Control"** without crashing the Modbus TCP session.

### 2. Modbus Memory Map Table (Unit-03 Chemical Reactor)

| Address | Hex Offset | Function Codes | Component Designation | Data Type | Engineering Units | Scale Factor |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `%QX0.0` | `0x0000` | FC01, FC05 | Inlet Feed Valve (`V-101`) | Boolean | 0: Closed, 1: Open | N/A |
| `%QX0.1` | `0x0001` | FC01, FC05 | Agitator Motor (`M-201`) | Boolean | 0: Off, 1: On | N/A |
| `%QX0.2` | `0x0002` | FC01, FC05 | Heating Element (`HTR-101`)| Boolean | 0: Off, 1: On | N/A |
| `%QX0.3` | `0x0003` | FC01, FC05 | Relief Valve (`RV-101`) | Boolean | 0: Closed, 1: Open | N/A |
| `%QW0.0` | `0x0000` | FC03, FC06 | Reactor Fluid Temp (`TT-101`)| 16-bit Unsigned | `0.0 °C to 200.0 °C` | `10` (`452` = `45.2°C`) |
| `%QW0.1` | `0x0001` | FC03, FC06 | Internal Pressure (`PT-101`) | 16-bit Unsigned | `0.00 to 10.00 bar` | `100` (`240` = `2.40 bar`)|
| `%QW0.2` | `0x0002` | FC03, FC06 | Feed Flow Rate (`FT-101`) | 16-bit Unsigned | `0.0 to 50.0 L/min` | `10` (`201` = `20.1 L/min`)|
| `%QW0.3` | `0x0003` | FC03, FC06 | Liquid Level (`LT-101`) | 16-bit Unsigned | `0.0% to 100.0%` | `10` (`550` = `55.0%`) |

### 3. Purdue Enterprise Reference Architecture (PERA) Breakdown

* **Level 0 (Physical Process)**: Physical sensors (`TT-101`, `PT-101`), solenoid valves (`V-101`), and heater coils (`HTR-101`).
* **Level 1 (Basic Control)**: OpenPLC v3 running inside isolated Docker container (`openplc_reactor`), exposing Modbus TCP Port 502.
* **Level 2 (Area Supervisory Control)**: Streamlit Operator Workstation (`Nexus OWS`), Python Digital Twin daemon (`reactor_sim.py`), and PB-IDS daemon (`ot_ids.py`).
* **Level 3 (Site Manufacturing Operations)**: SQLite Threat Database (`ot_security.db`) with Write-Ahead Logging (WAL) and OT SOC threat analytics dashboard.

### 4. OWS / HMI Cognitive-Load Design Rules
* **No Animated Flash**: Complete elimination of spinning 3D agitators or flashing neon borders.
* **Color Reservation**: Color is strictly forbidden for static ornamentation. Visual workspace uses greyscale, reserving Cyan for material movement and Red/Amber for active alarms.
* **Multi-Threaded Telemetry Pipelines**:
  * *Operational Pipeline*: Polls Modbus registers at $10\text{ Hz}$ into a localized time-series dataframe (`st.session_state`).
  * *Security Pipeline*: Queries `ot_security.db` for real-time FDI alerts without locking the UI thread.

---

## Section 8: Concrete Design Decisions for Implementation

Translating all research into fixed engineering parameters for software implementation:

### 1. Physical Boundaries & Threshold Parameters
* `MAX_TEMP_JUMP_PER_SEC`: **$2.5\text{ °C/sec}$** ($0.25\text{ °C}$ per $100\text{ ms}$ loop)
* `MAX_PRESSURE_JUMP_PER_SEC`: **$0.20\text{ bar/sec}$** ($0.02\text{ bar}$ per $100\text{ ms}$ loop)
* `NORMAL_TEMP_RANGE`: `20.0 °C` to `75.0 °C`
* `NORMAL_PRESSURE_RANGE`: `1.00 bar` to `4.50 bar`
* `NORMAL_LEVEL_RANGE`: `20.0 %` to `85.0 %`

### 2. Modbus Register Address Assignment Table
* `%QX0.0` (`Coil 0`): Inlet Feed Valve (`V-101`)
* `%QX0.1` (`Coil 1`): Agitator Motor (`M-201`)
* `%QX0.2` (`Coil 2`): Heating Element (`HTR-101`)
* `%QX0.3` (`Coil 3`): Emergency Relief Valve (`RV-101`)
* `%QW0.0` (`Holding Register 40001`): Reactor Fluid Temperature (`TT-101`, Scale: 10)
* `%QW0.1` (`Holding Register 40002`): Vessel Pressure (`PT-101`, Scale: 100)
* `%QW0.2` (`Holding Register 40003`): Inlet Flow Rate (`FT-101`, Scale: 10)
* `%QW0.3` (`Holding Register 40004`): Vessel Level (`LT-101`, Scale: 10)

### 3. ISA-18.2 Priority Configuration

| Priority Level | Trigger Condition | Color Hex | Visual Action | Audible |
| :--- | :--- | :--- | :--- | :--- |
| **Priority 1 (Critical)** | Temp $> 85.0\text{°C}$, Press $> 6.0\text{ bar}$, or Active FDI Attack | `#EF4444` | High-frequency flashing banner | Pulsed Tone |
| **Priority 2 (High)** | Temp $> 75.0\text{°C}$, Press $> 4.5\text{ bar}$, Level $> 85\%$ | `#F97316` | Steady Amber highlight | Single Warning Beep |
| **Priority 3 (Medium)** | Temp $< 15.0\text{°C}$, Level $< 20\%$ | `#EAB308` | Yellow text highlight | None |
| **Priority 4 (Low)** | Valve toggled, Agitator state change | `#06B6D4` | Static Cyan log entry | None |

### 4. UI Theme Design Tokens (ISA-101 Compliance)
```css
:root {
  --bg-primary: #0B0F19;
  --bg-card: #151D2A;
  --border-color: #1E293B;
  --text-primary: #F8FAFC;
  --text-muted: #64748B;
  --color-inactive: #475569;
  --color-flow-cyan: #0EA5E9;
  --color-alarm-critical: #EF4444;
  --color-alarm-high: #F97316;
  --color-alarm-medium: #EAB308;
  --color-alarm-low: #06B6D4;
}
```

### 5. MITRE ATT&CK for ICS Implementation Priority Matrix

```
   [Priority 1: Immediate Defense]
   - T0836: Modify Parameter (Process Setpoint Overwrite)
   - T0855: Unauthorized Command Message (Direct Coil Write)
   -> Implemented in ot_ids.py CUSUM detection and active deception overwrite.

   [Priority 2: Reconnaissance & Discovery]
   - T0888: Remote System Information Discovery
   - T0801: Monitor Process State (FC03 Polling Sweeps)
   - T0802: Device Identification (FC43 Fingerprinting)
   -> Emulated by OpenPLC response engine and logged to SQLite DB.

   [Priority 3: Inhibit Response & View Manipulation]
   - T0816: Alarm Suppression / Safety Interlock Bypass
   - T0832: Manipulation of View (False Telemetry Injection)
   -> Defeated by OWS dual-pipeline validation.

   [Priority 4: Persistence & Physical Impact]
   - T0889: Modify Programmed Logic
   - T0879: Property Damage / Thermal Runaway
   -> Mitigated via Docker isolation and E-STOP SCRAM logic.
```

---
*Document end — Research Brief prepared for Project Argus Phase 1.*
