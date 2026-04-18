import logging

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.auth_store import (
    read_settings_for_user,
    update_theme_mode,
)
from app.routes.auth_routes import router as auth_router
from app.schemas.auth_schemas import SettingsUpdateRequest, UserSettingsResponse

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Kinovo Triage API",
    version="0.1.0",
    description="Backend for the Kinovo waiting-room triage dashboard.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

try:
    from app.routes.ble_ingestion_routes import router as ble_ingestion_router

    app.include_router(ble_ingestion_router)
except Exception as exc:  # pragma: no cover - defensive availability guard
    logger.warning("BLE ingestion router disabled during startup: %s", exc)

try:
    from app.routes.dashboard_routes import router as dashboard_router

    app.include_router(dashboard_router)
except Exception as exc:  # pragma: no cover - defensive availability guard
    logger.warning("Dashboard router disabled during startup: %s", exc)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.get("/api/v1/settings", response_model=UserSettingsResponse)
async def get_settings(email: str = Query(default="staff.guest@kinovo.local")):
    return read_settings_for_user(email=email)


@app.put("/api/v1/settings", response_model=UserSettingsResponse)
async def put_settings(
    payload: SettingsUpdateRequest,
    email: str = Query(default="staff.guest@kinovo.local"),
):
    return update_theme_mode(mode=payload.mode, email=email)


