import asyncio
import logging
import datetime
from app.core.config import settings
from app.physics.state import reactor_state

logger = logging.getLogger("argus.physics")

class PhysicsEngine:
    def __init__(self):
        self._running = False
        self._task = None

    async def start(self):
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._simulation_loop())
            logger.info("Nuclear Digital Twin Physics Engine started (10Hz Forward Euler loop).")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            logger.info("Physics Engine stopped.")

    async def _simulation_loop(self):
        dt = settings.DELTA_T # 0.1s integration step
        
        while self._running:
            try:
                async with reactor_state._lock:
                    self._update_physics_step(dt)
                await asyncio.sleep(dt)
            except Exception as e:
                logger.error(f"Error in physics loop: {e}")
                await asyncio.sleep(dt)

    def _update_physics_step(self, dt: float):
        state = reactor_state

        # 1. E-STOP / SCRAM override dynamics
        if state.estop_active:
            state.fuel_valve = False
            state.heater_jacket = False
            state.relief_valve = True
            # Freeze core temperature and pressure at current peak to prevent auto-cooldown
            state.turbine_rpm = max(0.0, state.turbine_rpm - 150.0 * dt)
            state.generator_output = max(0.0, state.generator_output - 40.0 * dt)
            state.electrical_power = max(0.0, state.electrical_power - 20.0 * dt)
            state.fuel_pressure = 0.0
            state.fuel_flow = 0.0
            return

        # 2. Fuel pressure & flow dynamics (driven by fuel valve)
        target_fuel_press = state.setpoints.target_fuel_pressure if state.fuel_valve else 0.0
        fuel_press_delta = (target_fuel_press - state.fuel_pressure) * 1.5 * dt
        state.fuel_pressure = max(0.0, state.fuel_pressure + fuel_press_delta)
        state.fuel_flow = state.fuel_pressure * 4.2  # L/min

        # 3. Core Heat Generation & Thermal Dynamics
        q_combustion = state.fuel_flow * 850.0  # Watts
        q_heater = 10000.0 if state.heater_jacket else 0.0
        q_gen = q_combustion + q_heater

        # 4. Cooling Loop Dynamics
        state.coolant_flow = 50.0 if state.coolant_pump else 0.0
        t_env = 25.0
        t_coolant_in = 20.0
        u_area = 30.0  # Heat loss coefficient
        
        q_cooling = state.coolant_flow * 200.0 * (state.core_temp - t_coolant_in) / 50.0
        q_loss = u_area * (state.core_temp - t_env)
        q_remove = q_cooling + q_loss

        if state.relief_valve:
            q_remove += 15000.0

        m_cp = 250.0 * 4.184 * 10.0  # Effective thermal mass
        dT_dt = (q_gen - q_remove) / m_cp
        
        # Forward Euler Integration for Core Temperature
        state.core_temp = max(15.0, min(250.0, state.core_temp + dT_dt * dt))

        # 5. Core Pressure & Headspace Dynamics (Ideal Gas Law coupling)
        base_press = 1.0
        v_headspace = 100.0 - state.vessel_level
        thermal_expansion_press = (state.core_temp - 25.0) * 0.045
        
        target_core_press = base_press + thermal_expansion_press
        if state.relief_valve:
            target_core_press = max(1.0, target_core_press * 0.4)
            
        state.core_pressure += (target_core_press - state.core_pressure) * 2.0 * dt

        # 6. Steam Thermodynamics & Turbine Drive Chain
        target_steam_temp = max(20.0, state.core_temp * 1.85)
        state.steam_temp += (target_steam_temp - state.steam_temp) * 0.8 * dt

        target_steam_press = max(1.0, (state.steam_temp - 100.0) * 0.12) if state.steam_temp > 100.0 else 1.0
        state.steam_pressure += (target_steam_press - state.steam_pressure) * 1.2 * dt

        state.turbine_torque = max(0.0, (state.steam_pressure - 1.0) * 260.0)

        target_rpm = state.setpoints.target_rpm if (not state.estop_active and state.fuel_valve and state.steam_pressure > 1.5) else 0.0
        
        if target_rpm > 0:
            rpm_err = target_rpm - state.turbine_rpm
            state.turbine_rpm += max(-30.0, min(30.0, rpm_err * 0.5 * dt * 10))
        else:
            state.turbine_rpm = max(0.0, state.turbine_rpm - 150.0 * dt)

        # 7. Generator Output & Electrical Power Production
        if state.turbine_rpm > 500.0 and not state.estop_active:
            state.generator_output = min(100.0, (state.turbine_rpm / 3000.0) * 100.0)
            state.electrical_power = (state.generator_output / 100.0) * 50.0
        else:
            state.generator_output = max(0.0, state.generator_output - 40.0 * dt)
            state.electrical_power = max(0.0, state.electrical_power - 20.0 * dt)

        # 8. Coolant return temperature
        state.coolant_temp = t_coolant_in + (state.core_temp - t_coolant_in) * 0.25

physics_engine = PhysicsEngine()
