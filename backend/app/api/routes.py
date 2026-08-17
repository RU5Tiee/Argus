import datetime
import logging
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.physics.state import reactor_state
from app.alarms.engine import alarm_engine
from app.ids.deception import deception_router
from app.ids.cusum import cusum_detector
from app.mitre.registry import MITRE_ICS_TECHNIQUES, get_technique_by_id
from app.mitre.attack_chain import attack_chain_tracker
from app.mitre.attack_simulator import attack_simulator
from app.core.security import USERS_DB, create_access_token, get_current_user, require_write_permission, TokenData
from app.core.rbac import get_role_permissions
from app.db.database import get_db
from app.db.models import SecurityEventLog, AlarmHistoryLog, AuditLog
from app.api.schemas import (
    LoginRequest, LoginResponse, EstopRequest, SetpointRequest, ActuatorRequest,
    AlarmAckRequest, AlarmShelveRequest, AlarmClearRequest, AttackSimRequest, StartScenarioRequest, SystemModeRequest
)

logger = logging.getLogger("argus.api.routes")
router = APIRouter(prefix="/api/v1")

@router.post("/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    user_info = USERS_DB.get(req.username.lower())
    if not user_info or user_info["password"] != req.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"status": "error", "message": "Invalid username or password"}
        )

    token = create_access_token(user_info["username"], user_info["role"])
    perms = get_role_permissions(user_info["role"])

    return LoginResponse(
        status="success",
        access_token=token,
        token_type="bearer",
        username=user_info["username"],
        role=user_info["role"].value,
        user_name=user_info["name"],
        permissions=perms.dict()
    )

@router.get("/auth/me")
async def get_current_user_info(user: TokenData = Depends(get_current_user)):
    perms = get_role_permissions(user.role)
    user_info = USERS_DB.get(user.username, {"name": f"User ({user.username})"})
    return {
        "username": user.username,
        "role": user.role.value,
        "name": user_info.get("name"),
        "permissions": perms.dict()
    }

@router.get("/telemetry")
async def get_telemetry() -> Dict[str, Any]:
    payload = await reactor_state.get_formatted_telemetry()
    payload["alarms"] = alarm_engine.get_summary()
    attack_status = attack_chain_tracker.get_status()
    payload["security"] = {
        "cusum_score": round(cusum_detector.cusum_score, 3),
        "fdi_detected": reactor_state.deception_active,
        "last_attacker_ip": deception_router.last_attacker_ip,
        "intercepted_payloads_count": deception_router.intercepted_count,
        "active_mitre_techniques": attack_status["active_technique_ids"],
        "attack_chain_step": attack_status["current_phase"]
    }
    return payload

@router.post("/control/estop")
async def trigger_estop(
    req: EstopRequest,
    user: TokenData = Depends(require_write_permission),
    db: AsyncSession = Depends(get_db)
):
    async with reactor_state._lock:
        reactor_state.estop_active = True
        reactor_state.system_status = "SCRAM"
        reactor_state.last_estop_operator = user.username
        reactor_state.last_estop_timestamp = datetime.datetime.utcnow().isoformat() + "Z"
        reactor_state.last_estop_reason = req.reason
        
        reactor_state.fuel_valve = False
        reactor_state.heater_jacket = False
        reactor_state.relief_valve = True

    if "ALM-006" in alarm_engine.alarms:
        alarm = alarm_engine.alarms["ALM-006"]
        alarm.trigger("SCRAM ACTIVE", f"Emergency SCRAM by {user.username}: {req.reason}")
        alarm.operator = user.username
        alarm.reason = req.reason

    audit_entry = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        operator=user.username,
        action="ESTOP_SCRAM_TRIGGERED",
        details=f"Reason: {req.reason} at {reactor_state.last_estop_timestamp}"
    )
    db.add(audit_entry)
    await db.commit()

    logger.warning(f"EMERGENCY STOP (SCRAM) ACTUATED BY {user.username}: {req.reason}")
    return {
        "status": "success",
        "message": "EMERGENCY STOP (SCRAM) ENGAGED",
        "operator": user.username,
        "timestamp": reactor_state.last_estop_timestamp,
        "reason": req.reason
    }

@router.post("/control/setpoints")
async def update_setpoints(
    req: SetpointRequest,
    user: TokenData = Depends(require_write_permission),
    db: AsyncSession = Depends(get_db)
):
    async with reactor_state._lock:
        if req.target_rpm is not None:
            reactor_state.setpoints.target_rpm = max(0.0, min(3600.0, req.target_rpm))
        if req.target_temp is not None:
            reactor_state.setpoints.target_temp = max(15.0, min(120.0, req.target_temp))
        if req.target_pressure is not None:
            reactor_state.setpoints.target_pressure = max(0.5, min(8.0, req.target_pressure))
        if req.target_fuel_pressure is not None:
            reactor_state.setpoints.target_fuel_pressure = max(0.0, min(10.0, req.target_fuel_pressure))

    audit_entry = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        operator=user.username,
        action="SETPOINTS_UPDATED",
        details=f"Target Setpoints updated by {user.username}: {req.dict(exclude_none=True)}"
    )
    db.add(audit_entry)
    await db.commit()

    return {"status": "success", "setpoints": reactor_state.setpoints.dict()}

@router.post("/control/actuator")
async def toggle_actuator(
    req: ActuatorRequest,
    user: TokenData = Depends(require_write_permission),
    db: AsyncSession = Depends(get_db)
):
    async with reactor_state._lock:
        if req.actuator_name == "fuel_valve":
            reactor_state.fuel_valve = req.state
        elif req.actuator_name == "coolant_pump":
            reactor_state.coolant_pump = req.state
        elif req.actuator_name == "heater_jacket":
            reactor_state.heater_jacket = req.state
        elif req.actuator_name == "relief_valve":
            reactor_state.relief_valve = req.state
        else:
            raise HTTPException(status_code=400, detail=f"Unknown actuator: {req.actuator_name}")

    audit_entry = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        operator=user.username,
        action="ACTUATOR_TOGGLED",
        details=f"Actuator {req.actuator_name} set to {req.state} by {user.username}"
    )
    db.add(audit_entry)
    await db.commit()

    return {"status": "success", "actuator": req.actuator_name, "state": req.state}

@router.post("/alarms/acknowledge")
async def acknowledge_alarm(
    req: AlarmAckRequest,
    user: TokenData = Depends(require_write_permission),
    db: AsyncSession = Depends(get_db)
):
    if req.alarm_id not in alarm_engine.alarms:
        raise HTTPException(status_code=404, detail=f"Alarm ID {req.alarm_id} not found")
    
    alarm = alarm_engine.alarms[req.alarm_id]
    alarm.acknowledge(user.username)

    audit_entry = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        operator=user.username,
        action="ALARM_ACKNOWLEDGED",
        details=f"Acknowledged alarm {req.alarm_id} ({alarm.name}) by {user.username}"
    )
    db.add(audit_entry)
    await db.commit()

    return {"status": "success", "alarm": alarm.dict()}

@router.post("/alarms/shelve")
async def shelve_alarm(
    req: AlarmShelveRequest,
    user: TokenData = Depends(require_write_permission),
    db: AsyncSession = Depends(get_db)
):
    if req.alarm_id not in alarm_engine.alarms:
        raise HTTPException(status_code=404, detail=f"Alarm ID {req.alarm_id} not found")
    
    alarm = alarm_engine.alarms[req.alarm_id]
    alarm.shelve(req.duration_minutes, user.username, req.reason)

    audit_entry = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        operator=user.username,
        action="ALARM_SHELVED",
        details=f"Shelved alarm {req.alarm_id} for {req.duration_minutes}m by {user.username}. Reason: {req.reason}"
    )
    db.add(audit_entry)
    await db.commit()

    return {"status": "success", "alarm": alarm.dict()}

@router.post("/alarms/clear")
async def clear_alarm(
    req: AlarmClearRequest,
    user: TokenData = Depends(require_write_permission),
    db: AsyncSession = Depends(get_db)
):
    if req.alarm_id not in alarm_engine.alarms:
        raise HTTPException(status_code=404, detail=f"Alarm ID {req.alarm_id} not found")
    
    alarm = alarm_engine.alarms[req.alarm_id]
    alarm.clear()
    alarm.operator = user.username

    audit_entry = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        operator=user.username,
        action="ALARM_CLEARED",
        details=f"Cleared alarm {req.alarm_id} ({alarm.name}) by {user.username}"
    )
    db.add(audit_entry)
    await db.commit()

    return {"status": "success", "alarm": alarm.dict()}

@router.get("/simulation/scenarios")
async def list_attack_scenarios():
    return {"scenarios": attack_simulator.get_available_scenarios()}

@router.post("/simulation/start")
async def start_attack_scenario(
    req: StartScenarioRequest,
    user: TokenData = Depends(require_write_permission)
):
    try:
        scenario_state = await attack_simulator.start_scenario(req.scenario_id, req.attacker_ip)
        return {"status": "success", "scenario": scenario_state.dict()}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/simulation/stop")
async def stop_attack_scenario(user: TokenData = Depends(require_write_permission)):
    await attack_simulator.stop_scenario()
    return {"status": "success", "message": "Attack simulation stopped"}

@router.get("/simulation/active")
async def get_active_attack_scenario():
    if not attack_simulator.active_scenario:
        return {"active": False, "scenario": None}
    return {"active": True, "scenario": attack_simulator.active_scenario.dict()}

@router.post("/simulation/attack")
async def simulate_fdi_attack(
    req: AttackSimRequest,
    user: TokenData = Depends(require_write_permission)
):
    attack_chain_tracker.register_threat_event(req.technique_id)
    
    deception_overwritten_val = await deception_router.process_incoming_write(
        register_address=req.target_register,
        function_code=6,
        injected_value=req.injected_value,
        source_ip=req.source_ip
    )

    tech = get_technique_by_id(req.technique_id)

    return {
        "status": "ATTACK_INTERCEPTED",
        "target_register": req.target_register,
        "injected_payload": req.injected_value,
        "deception_overwritten_value": deception_overwritten_val,
        "illusion_of_control_maintained": True,
        "response_latency": "< 40 ms",
        "mitre_technique": tech.dict()
    }

@router.get("/security/events")
async def get_security_events(limit: int = 50, db: AsyncSession = Depends(get_db)):
    query = select(SecurityEventLog).order_by(SecurityEventLog.id.desc()).limit(limit)
    result = await db.execute(query)
    events = result.scalars().all()
    return {"events": [e.__dict__ for e in events]}

@router.get("/mitre/techniques")
async def get_mitre_techniques():
    return {
        "registry": [t.dict() for t in MITRE_ICS_TECHNIQUES.values()],
        "active_status": attack_chain_tracker.get_status()
    }

@router.post("/system/reset")
async def reset_system(
    user: TokenData = Depends(require_write_permission),
    db: AsyncSession = Depends(get_db)
):
    async with reactor_state._lock:
        reactor_state.estop_active = False
        reactor_state.deception_active = False
        reactor_state.system_status = "NORMAL"
        reactor_state.fuel_valve = True
        reactor_state.coolant_pump = True
        reactor_state.heater_jacket = True
        reactor_state.relief_valve = False
        reactor_state.core_temp = 45.0
        reactor_state.core_pressure = 2.4
        reactor_state.turbine_rpm = 3000.0

    await attack_simulator.stop_scenario()
    attack_simulator.active_scenario = None

    audit_entry = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        operator=user.username,
        action="SYSTEM_RESET",
        details=f"Plant state reset to normal operating baseline by {user.username}."
    )
    db.add(audit_entry)
    await db.commit()

    return {"status": "success", "message": "System reset to normal baseline"}

@router.post("/system/mode")
async def set_system_mode(
    req: SystemModeRequest,
    user: TokenData = Depends(require_write_permission),
    db: AsyncSession = Depends(get_db)
):
    async with reactor_state._lock:
        reactor_state.vulnerable_mode = req.vulnerable_mode
        if req.vulnerable_mode:
            # When enabling vulnerable mode, turn off any active deception states
            reactor_state.deception_active = False

    audit_entry = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        operator=user.username,
        action="SYSTEM_MODE_CHANGED",
        details=f"System Mode changed: Vulnerable Mode = {req.vulnerable_mode} by {user.username}"
    )
    db.add(audit_entry)
    await db.commit()

    logger.warning(f"SYSTEM SECURITY MODE CHANGED: Vulnerable Mode = {req.vulnerable_mode} by {user.username}")
    return {"status": "success", "vulnerable_mode": req.vulnerable_mode}

