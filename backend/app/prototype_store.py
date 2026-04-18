import json
from datetime import datetime, timezone
from pathlib import Path

from app.schemas.prototype import (
    AuthSessionResponse,
    DeviceSnapshotStore,
    PatientsSnapshotStore,
    StaffSignupRequest,
    StaffSignInRequest,
    ThemePreference,
    UserProfile,
    UserSettings,
    UserSettingsResponse,
    UserStore,
)
from app.auth_security import hash_password, verify_password

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
USERS_FILE = DATA_DIR / "users.json"
PATIENTS_SNAPSHOT_FILE = DATA_DIR / "patients.snapshot.json"
DEVICE_SNAPSHOT_FILE = DATA_DIR / "device.snapshot.json"


def _read_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _write_json(path: Path, payload: dict) -> None:
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)
        file.write("\n")


def read_user_store() -> UserStore:
    payload = _read_json(USERS_FILE)
    return UserStore.model_validate(payload)


def _default_user(email: str) -> UserProfile:
    return UserProfile(
        settings=UserSettings(preferences=ThemePreference(theme_mode="system")),
        name=email.split("@")[0].replace(".", " ").title(),
        age=None,
        hospital="Not set",
        position="Not set",
        password_hash="",
    )


def read_settings_for_user(email: str) -> UserSettingsResponse:
    store = read_user_store()
    user = store.users.get(email)

    if not user:
        user = _default_user(email)
        store.users[email] = user
        _write_json(USERS_FILE, store.model_dump(mode="json"))

    return UserSettingsResponse(email=email, **user.model_dump(mode="json"))


def update_theme_mode(mode: str, email: str) -> UserSettingsResponse:
    store = read_user_store()
    user = store.users.get(email) or _default_user(email)
    user.settings.preferences.theme_mode = mode
    store.users[email] = user
    _write_json(USERS_FILE, store.model_dump(mode="json"))
    return UserSettingsResponse(email=email, **user.model_dump(mode="json"))


def create_or_update_staff_user(payload: StaffSignupRequest) -> UserSettingsResponse:
    store = read_user_store()
    email = str(payload.email).strip().lower()
    existing = store.users.get(email)

    preferences = (
        existing.settings.preferences
        if existing
        else ThemePreference(theme_mode="system")
    )

    store.users[email] = UserProfile(
        settings=UserSettings(preferences=preferences),
        name=payload.name.strip(),
        age=payload.age,
        hospital=payload.hospital.strip(),
        position=payload.position.strip(),
        password_hash=hash_password(payload.password),
    )

    _write_json(USERS_FILE, store.model_dump(mode="json"))
    return UserSettingsResponse(email=email, **store.users[email].model_dump(mode="json"))


def authenticate_staff_user(payload: StaffSignInRequest) -> UserSettingsResponse:
    store = read_user_store()
    email = str(payload.email).strip().lower()
    user = store.users.get(email)

    if not user or not user.password_hash:
        raise ValueError("Invalid email or password.")

    if not verify_password(payload.password, user.password_hash):
        raise ValueError("Invalid email or password.")

    return UserSettingsResponse(email=email, **user.model_dump(mode="json"))


def read_patients_snapshot() -> dict:
    payload = _read_json(PATIENTS_SNAPSHOT_FILE)
    validated = PatientsSnapshotStore.model_validate(payload)
    return validated.model_dump(mode="json")


def read_device_snapshot() -> dict:
    payload = _read_json(DEVICE_SNAPSHOT_FILE)
    validated = DeviceSnapshotStore.model_validate(payload)
    return validated.model_dump(mode="json")
