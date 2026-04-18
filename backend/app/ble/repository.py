from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.database import AsyncSessionLocal
from app.models.vitals import VitalsRecord
from app.models.wearable import WearableDevice


class BleIngestionRepository:
    """Persists validated BLE packets into Postgres under the linked patient schema."""

    def __init__(self, session_factory: async_sessionmaker[AsyncSession] = AsyncSessionLocal) -> None:
        self._session_factory = session_factory

    async def persist_valid_frame(
        self,
        *,
        device_id: str,
        blood_oxygen: int,
        heart_beat: int,
        timestamp: datetime | None = None,
    ) -> VitalsRecord:
        reading_timestamp = timestamp or datetime.now(timezone.utc)

        async with self._session_factory() as session:
            wearable_stmt = select(WearableDevice).where(WearableDevice.device_id == device_id)
            wearable = (await session.execute(wearable_stmt)).scalar_one_or_none()

            if wearable is None:
                raise ValueError(f"Wearable '{device_id}' is not registered.")
            if not wearable.is_active:
                raise ValueError(f"Wearable '{device_id}' is inactive.")
            if wearable.patient_id is None:
                raise ValueError(f"Wearable '{device_id}' is not linked to a patient.")

            is_critical = blood_oxygen < 90 or heart_beat > 120
            critical_reason: str | None = None
            if blood_oxygen < 90:
                critical_reason = "low_spo2"
            elif heart_beat > 120:
                critical_reason = "high_heart_rate"

            vitals_record = VitalsRecord(
                patient_id=wearable.patient_id,
                device_id=wearable.id,
                blood_oxygen=blood_oxygen,
                heart_beat=heart_beat,
                timestamp=reading_timestamp,
                is_critical=is_critical,
                critical_reason=critical_reason,
            )

            wearable.last_sync_time = reading_timestamp
            session.add(vitals_record)
            await session.commit()
            await session.refresh(vitals_record)
            return vitals_record
