from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.controllers.auth_controller import (
    change_authenticated_password,
    confirm_staff_password_reset,
    delete_authenticated_account,
    create_staff_account,
    request_staff_password_reset,
    refresh_staff_session,
    sign_in_staff_account,
)
from app.schemas.auth_schemas import (
    AuthSessionResponse,
    ChangePasswordRequest,
    DeleteAccountRequest,
    ForgotPasswordRequest,
    GenericActionResponse,
    PasswordResetRequestResponse,
    ResetPasswordRequest,
    StaffSignInRequest,
    StaffSignupRequest,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=True)


@router.post("/staff/sign-up", response_model=AuthSessionResponse)
async def staff_signup(payload: StaffSignupRequest):
    return create_staff_account(payload)


@router.post("/staff/log-in", response_model=AuthSessionResponse)
async def staff_login(payload: StaffSignInRequest):
    return sign_in_staff_account(payload)


@router.post("/staff/login", response_model=AuthSessionResponse)
async def staff_login_alias(payload: StaffSignInRequest):
    """Compatibility alias for clients that call /staff/login (without hyphen)."""
    return sign_in_staff_account(payload)


@router.post("/session/refresh", response_model=AuthSessionResponse)
async def refresh_session(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    return refresh_staff_session(credentials.credentials)


@router.put("/me/password", response_model=AuthSessionResponse)
async def change_password(
    payload: ChangePasswordRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    return change_authenticated_password(credentials.credentials, payload)


@router.post("/password/forgot", response_model=PasswordResetRequestResponse)
async def forgot_password(payload: ForgotPasswordRequest):
    return request_staff_password_reset(payload)


@router.post("/password/reset", response_model=AuthSessionResponse)
async def reset_password(payload: ResetPasswordRequest):
    return confirm_staff_password_reset(payload)


@router.delete("/me", response_model=GenericActionResponse)
async def delete_account(
    payload: DeleteAccountRequest,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    return delete_authenticated_account(credentials.credentials, payload)
