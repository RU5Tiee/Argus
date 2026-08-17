import asyncio
import logging
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.config import settings
from app.physics.state import reactor_state
from app.alarms.engine import alarm_engine
from app.ids.cusum import cusum_detector
from app.ids.deception import deception_router
from app.mitre.attack_chain import attack_chain_tracker

logger = logging.getLogger("argus.websocket")

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected.")

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting WebSocket message: {e}")
                self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    # Background rx loop task to receive client frames and maintain keep-alive ping-pong
    async def rx_loop():
        try:
            while True:
                # Keep socket alive by reading client pings
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        except Exception:
            pass

    rx_task = asyncio.create_task(rx_loop())

    try:
        while not rx_task.done():
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

            await websocket.send_json(payload)
            await asyncio.sleep(settings.DELTA_T)
    except Exception as e:
        logger.error(f"WebSocket send loop error: {e}")
    finally:
        rx_task.cancel()
        manager.disconnect(websocket)
