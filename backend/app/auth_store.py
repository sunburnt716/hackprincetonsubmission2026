import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.auth_security import (
    RESET_TOKEN_EXPIRE_SECONDS,
    create_reset_token,
    hash_password,
    hash_reset_token,
    verify_password,
    verify_reset_token,
)
from app.schemas.auth_schemas import (
    AuthState,
    ChangePasswordRequest,
    DeleteAccountRequest,
    DeviceSnapshotStore,
    ForgotPasswordRequest,
    PatientsSnapshotStore,
    ResetPasswordRequest,
    StaffSignInRequest,
    StaffSignupRequest,
    ThemePreference,
    UserProfile,
    UserSettings,
    UserSettingsResponse,
    UserStore,
)

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
        auth_state=AuthState(),
    )


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _persist_store(store: UserStore) -> None:
    _write_json(USERS_FILE, store.model_dump(mode="json"))


def _get_user_profile(store: UserStore, email: str, *, create_if_missing: bool = False) -> UserProfile | None:
    normalized_email = _normalize_email(email)
    user = store.users.get(normalized_email)

    if user:
        return user

    if not create_if_missing:
        return None

    user = _default_user(normalized_email)
    store.users[normalized_email] = user
    _persist_store(store)
    return user


def read_settings_for_user(email: str) -> UserSettingsResponse:
    store = read_user_store()
    user = _get_user_profile(store, email, create_if_missing=True)

    return UserSettingsResponse(email=_normalize_email(email), **user.model_dump(mode="json"))


def update_theme_mode(mode: str, email: str) -> UserSettingsResponse:
    store = read_user_store()
    normalized_email = _normalize_email(email)
    user = store.users.get(normalized_email) or _default_user(normalized_email)
    user.settings.preferences.theme_mode = mode
    store.users[normalized_email] = user
    _persist_store(store)
    return UserSettingsResponse(email=normalized_email, **user.model_dump(mode="json"))


def create_or_update_staff_user(payload: StaffSignupRequest) -> UserSettingsResponse:
    store = read_user_store()
    email = _normalize_email(str(payload.email))
    existing = store.users.get(email)
    now = datetime.now(timezone.utc)

    preferences = (
        existing.settings.preferences
        if existing
        else ThemePreference(theme_mode="system")
    )

    token_version = existing.auth_state.token_version + 1 if existing else 0

    store.users[email] = UserProfile(
        settings=UserSettings(preferences=preferences),
        name=payload.name.strip(),
        age=payload.age,
        hospital=payload.hospital.strip(),
        position=payload.position.strip(),
        password_hash=hash_password(payload.password),
        auth_state=AuthState(
            password_changed_at=now,
            token_version=token_version,
        ),
    )

    _persist_store(store)
    return store.users[email]


def authenticate_staff_user(payload: StaffSignInRequest) -> UserSettingsResponse:
    store = read_user_store()
    email = _normalize_email(str(payload.email))
    user = store.users.get(email)

    if not user or not user.password_hash:
        raise ValueError("Invalid email or password.")

    if not verify_password(payload.password, user.password_hash):
        raise ValueError("Invalid email or password.")

    return user


def change_user_password(email: str, current_password: str, new_password: str) -> UserProfile:
    store = read_user_store()
    normalized_email = _normalize_email(email)
    user = store.users.get(normalized_email)

    if not user or not user.password_hash:
        raise ValueError("Invalid email or password.")

    if not verify_password(current_password, user.password_hash):
        raise ValueError("Invalid email or password.")

    user.password_hash = hash_password(new_password)
    user.auth_state.token_version += 1
    user.auth_state.password_changed_at = datetime.now(timezone.utc)
    user.auth_state.password_reset_token_hash = None
    user.auth_state.password_reset_token_expires_at = None
    user.auth_state.password_reset_requested_at = None

    store.users[normalized_email] = user
    _persist_store(store)
    return user


def request_password_reset(email: str) -> tuple[str | None, bool]:
    store = read_user_store()
    normalized_email = _normalize_email(email)
    user = store.users.get(normalized_email)

    if not user:
        return None, False

    reset_token = create_reset_token()
    now = datetime.now(timezone.utc)
    user.auth_state.password_reset_token_hash = hash_reset_token(reset_token)
    user.auth_state.password_reset_token_expires_at = now + timedelta(seconds=RESET_TOKEN_EXPIRE_SECONDS)
    user.auth_state.password_reset_requested_at = now

    store.users[normalized_email] = user
    _persist_store(store)
    return reset_token, True


def confirm_password_reset(
    email: str,
    reset_token: str,
    new_password: str,
) -> UserProfile:
    store = read_user_store()
    normalized_email = _normalize_email(email)
    user = store.users.get(normalized_email)

    if not user or not user.auth_state.password_reset_token_hash:
        raise ValueError("Invalid or expired reset token.")

    expires_at = user.auth_state.password_reset_token_expires_at
    if not expires_at or datetime.now(timezone.utc) > expires_at:
        raise ValueError("Invalid or expired reset token.")

    if not verify_reset_token(reset_token, user.auth_state.password_reset_token_hash):
        raise ValueError("Invalid or expired reset token.")

    user.password_hash = hash_password(new_password)
    user.auth_state.token_version += 1
    user.auth_state.password_changed_at = datetime.now(timezone.utc)
    user.auth_state.password_reset_token_hash = None
    user.auth_state.password_reset_token_expires_at = None
    user.auth_state.password_reset_requested_at = None

    store.users[normalized_email] = user
    _persist_store(store)
    return user


def delete_user_account(email: str, current_password: str) -> None:
    store = read_user_store()
    normalized_email = _normalize_email(email)
    user = store.users.get(normalized_email)

    if not user or not user.password_hash:
        raise ValueError("Invalid email or password.")

    if not verify_password(current_password, user.password_hash):
        raise ValueError("Invalid email or password.")

    del store.users[normalized_email]
    _persist_store(store)


def read_patients_snapshot() -> dict:
    payload = _read_json(PATIENTS_SNAPSHOT_FILE)
    validated = PatientsSnapshotStore.model_validate(payload)
    return validated.model_dump(mode="json")


def read_device_snapshot() -> dict:
    payload = _read_json(DEVICE_SNAPSHOT_FILE)
    validated = DeviceSnapshotStore.model_validate(payload)
    return validated.model_dump(mode="json")