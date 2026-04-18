import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Numeric, SmallInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDMixin


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

    # This phase focuses on waiting-room intake monitoring only.
    # Emergency transport envelope metadata is intentionally excluded.
