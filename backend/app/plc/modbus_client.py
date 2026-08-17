import asyncio
import logging
from pyModbusTCP.client import ModbusClient
from app.core.config import settings
from app.physics.state import reactor_state

logger = logging.getLogger("argus.plc.modbus")

class ModbusBridge:
    def __init__(self):
        self.client = ModbusClient(
            host=settings.MODBUS_HOST,
            port=settings.MODBUS_PORT,
            auto_open=True,
            auto_close=False,
            timeout=2.0
        )
        self.connected = False
        self._task = None

    async def start(self):
        self._task = asyncio.create_task(self._sync_loop())
        logger.info(f"Modbus TCP Bridge started targeting OpenPLC at {settings.MODBUS_HOST}:{settings.MODBUS_PORT}.")

    async def stop(self):
        if self._task:
            self._task.cancel()
        if self.client.is_open:
            self.client.close()

    async def _sync_loop(self):
        while True:
            try:
                if not self.client.is_open:
                    self.connected = self.client.open()

                if self.connected:
                    async with reactor_state._lock:
                        # 1. Write computed physics values to OpenPLC Holding Registers (%QW0.0 to %QW0.3)
                        raw_temp = int(reactor_state.core_temp * 10)       # Scale 10
                        raw_press = int(reactor_state.core_pressure * 100) # Scale 100
                        raw_flow = int(reactor_state.fuel_flow * 10)       # Scale 10
                        raw_level = int(reactor_state.vessel_level * 10)   # Scale 10

                        self.client.write_single_register(0, raw_temp)
                        self.client.write_single_register(1, raw_press)
                        self.client.write_single_register(2, raw_flow)
                        self.client.write_single_register(3, raw_level)

                        # 2. Read actuator coil states from OpenPLC (%QX0.0 to %QX0.3)
                        coils = self.client.read_coils(0, 4)
                        if coils and len(coils) >= 4:
                            reactor_state.fuel_valve = bool(coils[0])
                            reactor_state.coolant_pump = bool(coils[1])
                            reactor_state.heater_jacket = bool(coils[2])
                            reactor_state.relief_valve = bool(coils[3])

                await asyncio.sleep(settings.DELTA_T)
            except Exception as e:
                self.connected = False
                logger.debug(f"Modbus connection retry... ({e})")
                await asyncio.sleep(1.0)

modbus_bridge = ModbusBridge()
