from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.ble.pipeline import BleIngestionPipeline
from app.models.vitals import AckState
from app.schemas.ble_ingestion import BleIngestionRequest, BleIngestionResponse

router = APIRouter(prefix="/api/v1/ingestion", tags=["ingestion"])
pipeline = BleIngestionPipeline()


@router.post("/ble/frames", response_model=BleIngestionResponse)
async def ingest_ble_frames(payload: BleIngestionRequest):
    try:
        raw_payload = bytes.fromhex(payload.payload_hex)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="payload_hex is not valid hex input.",
        ) from exc

    try:
        result = await pipeline.ingest_bytes(
            device_id=payload.device_id,
            payload=raw_payload,
            timestamp=payload.timestamp,
            essential_vitals_only=payload.essential_vitals_only,
            buffered_during_dead_zone=payload.buffered_during_dead_zone,
            backfill_batch_id=payload.backfill_batch_id,
            retry_count=payload.retry_count,
            ack_state=AckState(payload.ack_state),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return result
