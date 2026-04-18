import uuid
from enum import Enum
from datetime import datetime

from sqlalchemy import Boolean, Enum as SQLEnum, ForeignKey, Integer, Numeric, SmallInteger, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


class AckState(str, Enum):
    pending = "pending"
    acknowledged = "acknowledged"
    failed = "failed"


class VitalsRecord(UUIDMixin, Base):
    """
    Immutable time-series record of a single vitals reading from a wearable device.
    Each row is one transmission envelope from the firmware.
    No updated_at — records are never modified after ingestion.
    """

    __tablename__ = "vitals_records"

    # --- FK references ---
    # TODO(timescaledb): When converting vitals_records to a TimescaleDB hypertable,
    # these FK constraints must be dropped first. TimescaleDB partitions the table
    # into time-based chunks internally, and Postgres cannot maintain FK constraints
    # across chunk boundaries. Referential integrity will need to be enforced at the
    # ingestion layer instead (verify patient and device exist before INSERT).
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

    # --- Clinical vitals (from firmware vitals payload) ---
    blood_oxygen: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    heart_beat: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    stress: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)

    # --- Reading timestamp (device time, not ingestion time) ---
    timestamp: Mapped[datetime] = mapped_column(nullable=False, index=True)

    # --- Clinical severity flags ---
    is_critical: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    critical_reason: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # --- Transport envelope metadata ---
    record_id: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False)
    ack_state: Mapped[AckState] = mapped_column(
        SQLEnum(AckState, name="ack_state"),
        default=AckState.pending,
        nullable=False,
    )
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    essential_vitals_only: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    buffered_during_dead_zone: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    backfill_batch_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
