from __future__ import annotations

from datetime import datetime, timezone

from app.ble.repository import BleIngestionRepository


def _parse_csv(payload: bytes) -> tuple[int, int] | None:
    text = payload.decode("utf-8", errors="ignore").strip()
    parts = text.split(",")
    if len(parts) < 2:
        return None
    try:
        return int(parts[0].strip()), int(parts[1].strip())
    except ValueError:
        return None


class BleIngestionPipeline:
    """Parse CSV BLE notification → validate → persist."""

    def __init__(self, repository: BleIngestionRepository | None = None) -> None:
        self._repository = repository or BleIngestionRepository()

    async def ingest_bytes(
        self,
        *,
        device_id: str,
        payload: bytes,
        timestamp: datetime | None = None,
    ) -> dict:
        parsed = _parse_csv(payload)

        if parsed is None:
            print(f"[BLE] Rejected invalid payload: {payload!r}")
            return {
                "ok": True,
                "receivedAt": datetime.now(timezone.utc).isoformat(),
                "deviceId": device_id,
                "acceptedCount": 0,
                "rejectedCount": 1,
                "accepted": [],
                "rejected": [{"raw": payload.hex(), "reason": "malformed_csv"}],
            }

        blood_oxygen, heart_beat = parsed
        persisted = await self._repository.persist_valid_frame(
            device_id=device_id,
            blood_oxygen=blood_oxygen,
            heart_beat=heart_beat,
            timestamp=timestamp,
        )

        point_timestamp = persisted.timestamp
        if point_timestamp.tzinfo is None:
            point_timestamp = point_timestamp.replace(tzinfo=timezone.utc)
        ts_ms = int(point_timestamp.timestamp() * 1000)

        return {
            "ok": True,
            "receivedAt": datetime.now(timezone.utc).isoformat(),
            "deviceId": device_id,
            "acceptedCount": 1,
            "rejectedCount": 0,
            "accepted": [
                {
                    "recordId": str(persisted.id),
                    "patientId": str(persisted.patient_id),
                    "deviceId": device_id,
                    "points": [
                        {"x": ts_ms, "y": persisted.blood_oxygen, "series": "spo2"},
                        {"x": ts_ms, "y": persisted.heart_beat, "series": "heartBeat"},
                    ],
                }
            ],
            "rejected": [],
        }
