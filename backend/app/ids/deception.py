import asyncio
import logging
import datetime
from app.physics.state import reactor_state
from app.ids.cusum import cusum_detector
from app.db.database import AsyncSessionLocal
from app.db.models import SecurityEventLog

logger = logging.getLogger("argus.ids.deception")

class ActiveDeceptionRouter:
    def __init__(self):
        self._mutex = asyncio.Lock()
        self.intercepted_count: int = 0
        self.last_attacker_ip: str = "127.0.0.1"

    async def process_incoming_write(
        self,
        register_address: str,
        function_code: int,
        injected_value: float,
        source_ip: str = "192.168.1.105"
    ) -> float:
        async with self._mutex:
            self.last_attacker_ip = source_ip
            is_attack = False
            attack_type = "NORMAL"

            if register_address in ["%QW0.0", "40001"]:
                is_attack, attack_type, _ = cusum_detector.evaluate_temp_change(injected_value)

            if is_attack:
                self.intercepted_count += 1
                
                if reactor_state.vulnerable_mode:
                    reactor_state.core_temp = injected_value
                    asyncio.create_task(
                        self._log_security_event(
                            source_ip=source_ip,
                            target_register=register_address,
                            function_code=function_code,
                            injected_payload=injected_value,
                            safe_value=injected_value,
                            attack_type=f"{attack_type}_SUCCESSFUL"
                        )
                    )
                    return injected_value

                reactor_state.deception_active = True
                safe_fabricated_value = reactor_state.core_temp + 0.15

                logger.info(
                    f"[ACTIVE DECEPTION OVERWRITE] Intercepted FDI payload ({injected_value}°C) "
                    f"from {source_ip} on {register_address}. Overwriting with safe value ({safe_fabricated_value:.1f}°C)."
                )

                asyncio.create_task(
                    self._log_security_event(
                        source_ip=source_ip,
                        target_register=register_address,
                        function_code=function_code,
                        injected_payload=injected_value,
                        safe_value=safe_fabricated_value,
                        attack_type=attack_type
                    )
                )

                return safe_fabricated_value

            return injected_value

    async def _log_security_event(
        self,
        source_ip: str,
        target_register: str,
        function_code: int,
        injected_payload: float,
        safe_value: float,
        attack_type: str
    ):
        try:
            async with AsyncSessionLocal() as db:
                log_entry = SecurityEventLog(
                    timestamp=datetime.datetime.utcnow(),
                    event_type=f"FDI_ATTACK_{attack_type}",
                    source_ip=source_ip,
                    target_register=target_register,
                    function_code=function_code,
                    injected_payload=injected_payload,
                    deception_overwritten_value=safe_value,
                    mitre_technique_id="T0836",
                    mitre_technique_name="Modify Parameter",
                    attack_chain_phase="Impair Process Control",
                    details=f"Intercepted {injected_payload} on {target_register}. Overwritten with {safe_value} in <40ms."
                )
                db.add(log_entry)
                await db.commit()
        except Exception as e:
            logger.error(f"Error logging security event to SQLite WAL: {e}")

deception_router = ActiveDeceptionRouter()
