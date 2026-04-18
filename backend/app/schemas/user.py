import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import PatientStatus, UserStatus


# ---------------------------------------------------------------------------
# Staff auth schemas
# ---------------------------------------------------------------------------

class StaffSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=255)
    staff_role: str = Field(min_length=1, max_length=100)
    hospital_name: str = Field(min_length=1, max_length=255)
    facility_id: str = Field(min_length=1, max_length=100)
    staff_id: str | None = Field(default=None, max_length=100)
    department: str | None = Field(default=None, max_length=100)

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()


class StaffLoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    staff_role: str
    hospital_name: str
    facility_id: str
    staff_id: str | None
    department: str | None
    status: UserStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---------------------------------------------------------------------------
# Patient record schemas (created by staff, no auth)
# ---------------------------------------------------------------------------

class PatientCreateRequest(BaseModel):
    """Full intake — staff has time to collect complete profile."""
    full_name: str = Field(min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    age: int | None = Field(default=None, ge=0, le=130)
    known_conditions: str | None = None
    current_medications: str | None = None
    emergency_contact: str | None = Field(default=None, max_length=255)


class TemporaryPatientCreateRequest(BaseModel):
    """Fast intake — name only required, profile filled in later."""
    full_name: str = Field(min_length=1, max_length=255)
    email: str | None = Field(default=None, max_length=255)


class PatientResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str | None
    age: int | None
    known_conditions: str | None
    current_medications: str | None
    emergency_contact: str | None
    temporary: bool
    status: PatientStatus
    wait_started_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
