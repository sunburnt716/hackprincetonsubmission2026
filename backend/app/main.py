from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from app.auth_store import (
    read_device_snapshot,
    read_patients_snapshot,
    read_settings_for_user,
    update_theme_mode,
)
from app.routes.auth_routes import router as auth_router
from app.schemas.auth_schemas import SettingsUpdateRequest, UserSettingsResponse

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


@app.get("/api/v1/dashboard/waiting-room")
async def get_waiting_room_snapshot():
    return read_patients_snapshot()


@app.get("/api/v1/dashboard/device-health")
async def get_device_health_snapshot():
    return read_device_snapshot()
