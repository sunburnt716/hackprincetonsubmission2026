from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


AckStateLiteral = Literal["pending", "acknowledged", "failed"]


class BleIngestionRequest(BaseModel):
    device_id: str = Field(min_length=1, max_length=50)
    payload_hex: str = Field(min_length=2)
    timestamp: datetime | None = None
    essential_vitals_only: bool = False
    buffered_during_dead_zone: bool = False
    backfill_batch_id: str | None = Field(default=None, max_length=100)
    retry_count: int = Field(default=0, ge=0)
    ack_state: AckStateLiteral = "acknowledged"

    @field_validator("payload_hex", mode="before")
    @classmethod
    def normalize_payload_hex(cls, value: str) -> str:
        normalized = value.replace(" ", "").lower()
        if normalized.startswith("0x"):
            normalized = normalized[2:]

        if len(normalized) % 2 != 0:
            raise ValueError("payload_hex must contain an even number of hex characters.")

        return normalized


class BleIngestionResponse(BaseModel):
    ok: bool
    receivedAt: str
    deviceId: str
    acceptedCount: int
    rejectedCount: int
    accepted: list[dict]
    rejected: list[dict]
