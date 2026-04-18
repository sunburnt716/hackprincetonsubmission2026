import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class WearableResponse(BaseModel):
    id: uuid.UUID
    device_id: str
    patient_id: uuid.UUID | None
    battery_level: int | None
    signal_strength: int | None
    last_sync_time: datetime | None
    is_active: bool

    model_config = {"from_attributes": True}


class DeviceHealthResponse(BaseModel):
    """Flattened view for the dashboard device-health panel."""
    device_id: str
    patient_name: str | None
    battery_level: int | None = Field(description="0-100%")
    signal_strength: int | None = Field(description="dBm, typically -95 to -45")
    last_sync_time: datetime | None
    is_active: bool
