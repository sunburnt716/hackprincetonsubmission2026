import uuid

from sqlalchemy import Boolean, ForeignKey, SmallInteger, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.user import Patient
from datetime import datetime


class WearableDevice(UUIDMixin, TimestampMixin, Base):
    """Physical wearable device. Can exist unassigned (patient_id=NULL) before pairing."""

    __tablename__ = "wearable_devices"

    device_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    patient_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    battery_level: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    signal_strength: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    last_sync_time: Mapped[datetime | None] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    patient: Mapped["Patient | None"] = relationship("Patient", back_populates="wearable")
