from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class BleIngestionRequest(BaseModel):
    device_id: str = Field(min_length=1, max_length=50)
    payload_hex: str = Field(min_length=2)
    timestamp: datetime | None = None

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
