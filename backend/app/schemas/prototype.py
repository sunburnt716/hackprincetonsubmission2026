from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

ThemeMode = Literal["system", "light", "dark"]
ConnectionStatus = Literal[
    "unpaired",
    "pending_reads",
    "connected",
    "disconnected",
]


class ThemePreference(BaseModel):
    theme_mode: ThemeMode = "system"


class UserSettings(BaseModel):
    preferences: ThemePreference = ThemePreference()


class UserProfile(BaseModel):
    settings: UserSettings = UserSettings()
    name: str
    age: int | None = None
    hospital: str
    position: str
    password_hash: str = ""


class UserStore(BaseModel):
    schema_version: int = 1
    users: dict[str, UserProfile]


class UserSettingsResponse(BaseModel):
    email: EmailStr
    settings: UserSettings
    name: str
    age: int | None = None
    hospital: str
    position: str


class SettingsUpdateRequest(BaseModel):
    mode: ThemeMode


class StaffSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)
    name: str = Field(min_length=1)
    age: int | None = Field(default=None, ge=0)
    hospital: str = Field(min_length=1)
    position: str = Field(min_length=1)


class StaffSignInRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class AuthSessionResponse(BaseModel):
    ok: bool = True
    user: UserSettingsResponse
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int = 900
    message: str


class VitalsSnapshot(BaseModel):
    timestamp: datetime
    blood_oxygen: int = Field(ge=0, le=100)
    heart_beat: int = Field(ge=0)
    stress: float | None = None


class WearableSnapshot(BaseModel):
    device_id: str
    battery_level: int | None = Field(default=None, ge=0, le=100)
    signal_strength: int | None = None
    last_sync_time: datetime | None = None
    paired_at: datetime | None = None
    is_active: bool = True
    connection_status: ConnectionStatus = "unpaired"


class PatientSnapshot(BaseModel):
    id: str
    full_name: str
    email: str | None = None
    temporary: bool = False
    status: str = "waiting"
    wait_started_at: datetime
    latest_vitals: VitalsSnapshot
    wearable: WearableSnapshot


class PatientsSnapshotStore(BaseModel):
    schema_version: int = 1
    updated_at: datetime
    patients: list[PatientSnapshot]


class DeviceSnapshot(BaseModel):
    device_id: str
    patient_id: str | None = None
    patient_name: str | None = None
    battery_level: int | None = Field(default=None, ge=0, le=100)
    signal_strength: int | None = None
    last_sync_time: datetime | None = None
    is_active: bool = True
    connection_status: ConnectionStatus = "unpaired"


class DeviceSnapshotStore(BaseModel):
    schema_version: int = 1
    updated_at: datetime
    devices: list[DeviceSnapshot]
