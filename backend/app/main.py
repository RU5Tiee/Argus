import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import init_db
from app.physics.engine import physics_engine
from app.plc.modbus_client import modbus_bridge
from app.api.routes import router as api_router
from app.api.websocket import router as ws_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("argus.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Initializing Argus Cyber-Physical Backend...")
    
    # 1. Enforce SQLite WAL mode and create tables
    await init_db()
    logger.info("SQLite database initialized with Write-Ahead Logging (WAL) mode.")

    # 2. Start Digital Twin Physics Engine daemon (10Hz Forward Euler)
    await physics_engine.start()

    # 3. Start Modbus TCP Bridge targeting OpenPLC
    await modbus_bridge.start()

    yield

    # Shutdown sequence
    logger.info("Shutting down Argus Cyber-Physical Backend...")
    await modbus_bridge.stop()
    await physics_engine.stop()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Process-Aware OT Deception & Digital Twin Cyber Defense Backend",
    lifespan=lifespan
)

# Enforce CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(api_router)
app.include_router(ws_router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "system": settings.APP_NAME,
        "version": settings.VERSION,
        "modbus_connected": modbus_bridge.connected,
        "physics_running": physics_engine._running
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
