import os
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

ALGORITHM = os.getenv("ALGORITHM", "HS256")
SECRET_KEY = os.getenv("SECRET_KEY", "kinovo-dev-secret")
ACCESS_TOKEN_EXPIRE_SECONDS = 15 * 60
RESET_TOKEN_EXPIRE_SECONDS = 30 * 60
TOKEN_ISSUER = "kinovo-backend"

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, *, additional_claims: dict | None = None) -> tuple[str, int]:
    now = datetime.now(timezone.utc)
    expires_delta = timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)
    expire_at = now + expires_delta
    payload = {
        "sub": subject,
        "iss": TOKEN_ISSUER,
        "iat": int(now.timestamp()),
        "exp": int(expire_at.timestamp()),
    }

    if additional_claims:
        payload.update(additional_claims)

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token, ACCESS_TOKEN_EXPIRE_SECONDS


def create_reset_token() -> str:
    return secrets.token_urlsafe(32)


def hash_reset_token(reset_token: str) -> str:
    return pwd_context.hash(reset_token)


def verify_reset_token(reset_token: str, hashed_reset_token: str) -> bool:
    return pwd_context.verify(reset_token, hashed_reset_token)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], issuer=TOKEN_ISSUER)
    except JWTError as exc:
        raise ValueError("Invalid or expired session token.") from exc
