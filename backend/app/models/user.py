import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Enum, ForeignKey, SmallInteger, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class UserStatus(str, enum.Enum):
    active = "active"
    pending_verification = "pending-verification"


class PatientStatus(str, enum.Enum):
    waiting = "waiting"
    discharged = "discharged"
    pending_registration = "pending-registration"


class User(UUIDMixin, TimestampMixin, Base):
    """Staff accounts — the only auth-capable entity in the system."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    staff_role: Mapped[str] = mapped_column(String(100), nullable=False)
    hospital_name: Mapped[str] = mapped_column(String(255), nullable=False)
    facility_id: Mapped[str] = mapped_column(String(100), nullable=False)
    staff_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status"),
        default=UserStatus.pending_verification,
        nullable=False,
    )

    admitted_patients: Mapped[list["Patient"]] = relationship(
        "Patient", back_populates="created_by", foreign_keys="Patient.created_by_id"
    )


class Patient(UUIDMixin, TimestampMixin, Base):
    """Patient records created by staff — not auth accounts."""

    __tablename__ = "patients"

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    age: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    known_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_medications: Mapped[str | None] = mapped_column(Text, nullable=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    temporary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[PatientStatus] = mapped_column(
        Enum(PatientStatus, name="patient_status"),
        default=PatientStatus.waiting,
        nullable=False,
    )
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    wait_started_at: Mapped[datetime] = mapped_column(
        "wait_started_at",
        nullable=False,
    )

    created_by: Mapped["User"] = relationship(
        "User", back_populates="admitted_patients", foreign_keys=[created_by_id]
    )
    wearable: Mapped["WearableDevice | None"] = relationship(  # noqa: F821
        "WearableDevice", back_populates="patient", uselist=False
    )
