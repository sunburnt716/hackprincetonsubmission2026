from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

ConnectionStatus = Literal["unpaired", "pending_reads", "connected", "disconnected"]


class AddPatientRequest(BaseModel):
    full_name: str = Field(min_length=1)
    email: str = Field(min_length=3)
    temporary: bool = False
    created_by_login_id: str = Field(min_length=1)


class WearablePrecheckRequest(BaseModel):
    patient_id: str | None = None


class WearablePrecheckResponse(BaseModel):
    wearableId: str
    batteryLevel: int
    signalStrength: int
    lastReadAt: datetime | None
    hasActiveReads: bool
    batteryCritical: bool
    lowBatteryThreshold: int
    connectionStatusLabel: str


class BindWearableRequest(BaseModel):
    device_id: str = Field(min_length=1)


class PairingStatusResponse(BaseModel):
    patientId: str
    connectionStatus: ConnectionStatus
    deviceId: str | None
    activeReadsHealthy: bool
    lastSyncTime: datetime | None


class GenericDashboardAction(BaseModel):
    ok: bool = True
    message: str


class PatientDetailResponse(BaseModel):
    schema_version: int = 1
    updated_at: datetime
    patient: dict
