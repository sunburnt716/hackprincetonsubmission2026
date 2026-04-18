from __future__ import annotations

from dataclasses import asdict
from datetime import datetime, timezone

from app.ble.imputation import build_imputation_placeholder
from app.ble.parser import BleFrameParser
from app.ble.repository import BleIngestionRepository
from app.models.vitals import AckState


class BleIngestionPipeline:
    """Device-aware ingestion orchestrator: parse -> validate -> persist."""

    def __init__(self, repository: BleIngestionRepository | None = None) -> None:
        self._repository = repository or BleIngestionRepository()
        self._parsers: dict[str, BleFrameParser] = {}

    def _get_parser(self, device_id: str) -> BleFrameParser:
        parser = self._parsers.get(device_id)
        if parser is None:
            parser = BleFrameParser()
            self._parsers[device_id] = parser
        return parser

    async def ingest_bytes(
        self,
        *,
        device_id: str,
        payload: bytes,
        timestamp: datetime | None = None,
        essential_vitals_only: bool = False,
        buffered_during_dead_zone: bool = False,
        backfill_batch_id: str | None = None,
        retry_count: int = 0,
        ack_state: AckState = AckState.acknowledged,
    ) -> dict:
        parser = self._get_parser(device_id)
        parsed_frames = parser.ingest(payload)

        accepted: list[dict] = []
        rejected: list[dict] = []

        for parsed_frame in parsed_frames:
            if parsed_frame.valid:
                persisted = await self._repository.persist_valid_frame(
                    device_id=device_id,
                    blood_oxygen=int(parsed_frame.blood_oxygen or 0),
                    heart_beat=int(parsed_frame.heart_beat or 0),
                    stress=parsed_frame.stress,
                    sequence_number=int(parsed_frame.sequence_number or 0),
                    checksum=str(parsed_frame.checksum or "00"),
                    timestamp=timestamp,
                    essential_vitals_only=essential_vitals_only,
                    buffered_during_dead_zone=buffered_during_dead_zone,
                    backfill_batch_id=backfill_batch_id,
                    retry_count=retry_count,
                    ack_state=ack_state,
                )

                point_timestamp = persisted.timestamp
                if point_timestamp.tzinfo is None:
                    point_timestamp = point_timestamp.replace(tzinfo=timezone.utc)

                ts_ms = int(point_timestamp.timestamp() * 1000)
                accepted.append(
                    {
                        "recordId": persisted.record_id,
                        "patientId": str(persisted.patient_id),
                        "deviceId": device_id,
                        "transportMeta": {
                            "sequenceNumber": persisted.sequence_number,
                            "checksum": persisted.checksum,
                            "ackState": persisted.ack_state.value,
                            "retryCount": persisted.retry_count,
                            "essentialVitalsOnly": persisted.essential_vitals_only,
                            "bufferedDuringDeadZone": persisted.buffered_during_dead_zone,
                            "backfillBatchId": persisted.backfill_batch_id,
                        },
                        "points": [
                            {"x": ts_ms, "y": persisted.blood_oxygen, "series": "spo2"},
                            {"x": ts_ms, "y": persisted.heart_beat, "series": "heartBeat"},
                            {
                                "x": ts_ms,
                                "y": float(persisted.stress) if persisted.stress is not None else None,
                                "series": "stress",
                            },
                        ],
                    }
                )
            else:
                placeholder = build_imputation_placeholder(
                    device_id=device_id,
                    reason=parsed_frame.reason or "invalid_frame",
                    raw_frame=parsed_frame.raw_frame,
                )
                rejected.append(asdict(placeholder))

        return {
            "ok": True,
            "receivedAt": datetime.now(timezone.utc).isoformat(),
            "deviceId": device_id,
            "acceptedCount": len(accepted),
            "rejectedCount": len(rejected),
            "accepted": accepted,
            "rejected": rejected,
        }
