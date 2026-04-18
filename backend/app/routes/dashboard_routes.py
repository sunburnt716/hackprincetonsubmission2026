from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import Patient
from app.models.vitals import VitalsRecord
from app.models.wearable import WearableDevice

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/waiting-room")
async def get_waiting_room_snapshot(db: AsyncSession = Depends(get_db)):
    latest_vitals_subquery = (
        select(
            VitalsRecord.patient_id.label("patient_id"),
            func.max(VitalsRecord.timestamp).label("latest_timestamp"),
        )
        .group_by(VitalsRecord.patient_id)
        .subquery()
    )

    statement = (
        select(Patient, WearableDevice, VitalsRecord)
        .outerjoin(WearableDevice, WearableDevice.patient_id == Patient.id)
        .outerjoin(
            latest_vitals_subquery,
            latest_vitals_subquery.c.patient_id == Patient.id,
        )
        .outerjoin(
            VitalsRecord,
            and_(
                VitalsRecord.patient_id == Patient.id,
                VitalsRecord.timestamp == latest_vitals_subquery.c.latest_timestamp,
            ),
        )
        .order_by(Patient.wait_started_at.asc())
    )

    rows = (await db.execute(statement)).all()
    now_utc = datetime.now(timezone.utc)

    patients_payload: list[dict] = []
    for patient, wearable, vitals in rows:
        vitals_timestamp = vitals.timestamp if vitals else patient.wait_started_at
        connection_status = "unpaired"

        if wearable and wearable.patient_id and wearable.is_active:
            connection_status = "connected"
        elif wearable and wearable.patient_id and not wearable.is_active:
            connection_status = "disconnected"

        patients_payload.append(
            {
                "id": str(patient.id),
                "full_name": patient.full_name,
                "email": patient.email,
                "temporary": patient.temporary,
                "status": patient.status.value,
                "wait_started_at": patient.wait_started_at,
                "latest_vitals": {
                    "timestamp": vitals_timestamp,
                    "blood_oxygen": vitals.blood_oxygen if vitals else 0,
                    "heart_beat": vitals.heart_beat if vitals else 0,
                    "stress": float(vitals.stress) if vitals and vitals.stress is not None else None,
                },
                "wearable": {
                    "device_id": wearable.device_id if wearable else "unassigned",
                    "battery_level": wearable.battery_level if wearable else None,
                    "signal_strength": wearable.signal_strength if wearable else None,
                    "last_sync_time": wearable.last_sync_time if wearable else None,
                    "paired_at": wearable.created_at if wearable else None,
                    "is_active": wearable.is_active if wearable else False,
                    "connection_status": connection_status,
                },
            }
        )

    return {
        "schema_version": 1,
        "updated_at": now_utc,
        "patients": patients_payload,
    }


@router.get("/device-health")
async def get_device_health_snapshot(db: AsyncSession = Depends(get_db)):
    statement = (
        select(WearableDevice, Patient)
        .outerjoin(Patient, WearableDevice.patient_id == Patient.id)
        .order_by(WearableDevice.device_id.asc())
    )
    rows = (await db.execute(statement)).all()

    devices_payload: list[dict] = []
    for wearable, patient in rows:
        connection_status = "unpaired"
        if wearable.patient_id and wearable.is_active:
            connection_status = "connected"
        elif wearable.patient_id and not wearable.is_active:
            connection_status = "disconnected"

        devices_payload.append(
            {
                "device_id": wearable.device_id,
                "patient_id": str(wearable.patient_id) if wearable.patient_id else None,
                "patient_name": patient.full_name if patient else None,
                "battery_level": wearable.battery_level,
                "signal_strength": wearable.signal_strength,
                "last_sync_time": wearable.last_sync_time,
                "is_active": wearable.is_active,
                "connection_status": connection_status,
            }
        )

    return {
        "schema_version": 1,
        "updated_at": datetime.now(timezone.utc),
        "devices": devices_payload,
    }
