from fastapi import HTTPException, status

from app.auth_security import create_access_token, decode_access_token
from app.auth_store import (
    change_user_password,
    confirm_password_reset,
    delete_user_account,
    authenticate_staff_user,
    create_or_update_staff_user,
    request_password_reset,
    read_user_store,
)
from app.schemas.auth_schemas import (
    AuthSessionResponse,
    ChangePasswordRequest,
    DeleteAccountRequest,
    ForgotPasswordRequest,
    GenericActionResponse,
    PasswordResetRequestResponse,
    ResetPasswordRequest,
    StaffSignupRequest,
    StaffSignInRequest,
    UserSettingsResponse,
)


def _build_user_response(email: str, user) -> UserSettingsResponse:
    normalized_email = str(email).strip().lower()
    return UserSettingsResponse(email=normalized_email, **user.model_dump(mode="json"))


def _build_session_response(email: str, user, message: str) -> AuthSessionResponse:
    normalized_email = str(email).strip().lower()
    access_token, expires_in_seconds = create_access_token(
        subject=normalized_email,
        additional_claims={
            "account_type": "staff",
            "token_version": user.auth_state.token_version,
        },
    )

    return AuthSessionResponse(
        ok=True,
        user=_build_user_response(normalized_email, user),
        access_token=access_token,
        expires_in_seconds=expires_in_seconds,
        message=message,
    )


def create_staff_account(payload: StaffSignupRequest) -> AuthSessionResponse:
    user = create_or_update_staff_user(payload)
    return _build_session_response(payload.email, user, "Staff account created successfully and signed in.")


def sign_in_staff_account(payload: StaffSignInRequest) -> AuthSessionResponse:
    try:
        user = authenticate_staff_user(payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    return _build_session_response(payload.email, user, "Staff sign-in successful.")


def _get_authenticated_user(token: str):
    claims = decode_access_token(token)
    email = str(claims.get("sub") or "").strip().lower()

    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing token subject.",
        )

    store = read_user_store()
    user = store.users.get(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    token_version = claims.get("token_version")
    if token_version is None or token_version != user.auth_state.token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again.",
        )

    return email, user


def change_authenticated_password(token: str, payload: ChangePasswordRequest) -> AuthSessionResponse:
    try:
        email, user = _get_authenticated_user(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    try:
        updated_user = change_user_password(email, payload.current_password, payload.new_password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    return _build_session_response(email, updated_user, "Password updated successfully.")


def request_staff_password_reset(payload: ForgotPasswordRequest) -> PasswordResetRequestResponse:
    reset_token, found = request_password_reset(payload.email)
    message = "If an account exists for that email, a reset token has been generated."

    return PasswordResetRequestResponse(
        ok=True,
        message=message,
        reset_token=reset_token if found else None,
    )


def confirm_staff_password_reset(payload: ResetPasswordRequest) -> AuthSessionResponse:
    if payload.new_password != payload.confirm_new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match.",
        )

    try:
        user = confirm_password_reset(
            payload.email,
            payload.reset_token,
            payload.new_password,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return _build_session_response(payload.email, user, "Password reset successfully.")


def delete_authenticated_account(token: str, payload: DeleteAccountRequest) -> GenericActionResponse:
    try:
        email, _user = _get_authenticated_user(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    try:
        delete_user_account(email, payload.current_password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    return GenericActionResponse(ok=True, message="Account deleted successfully.")


def refresh_staff_session(token: str) -> AuthSessionResponse:
    try:
        email, user = _get_authenticated_user(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    return _build_session_response(email, user, "Session refreshed.")
