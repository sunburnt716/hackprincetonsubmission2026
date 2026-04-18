import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Numeric, SmallInteger, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class VitalsRecord(UUIDMixin, Base):
    __tablename__ = "vitals_records"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("wearable_devices.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    blood_oxygen: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    heart_beat: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    stress: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)

    timestamp: Mapped[datetime] = mapped_column(nullable=False, index=True)

    is_critical: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    critical_reason: Mapped[str | None] = mapped_column(String(100), nullable=True)
