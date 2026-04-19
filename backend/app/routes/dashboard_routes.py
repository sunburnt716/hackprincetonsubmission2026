from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.dashboard_store import (
    add_patient,
    bind_wearable,
    get_device_health_snapshot as load_device_health_snapshot,
    get_critical_moments_history,
    get_pairing_status,
    get_patient_detail,
    get_waiting_room_snapshot as load_waiting_room_snapshot,
    list_available_wearables,
    release_patient,
    run_wearable_precheck,
    unbind_wearable,
)
from app.schemas.dashboard import (
    AddPatientRequest,
    BindWearableRequest,
    GenericDashboardAction,
    PairingStatusResponse,
    PatientDetailResponse,
    WearablePrecheckRequest,
    WearablePrecheckResponse,
)

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/waiting-room")
async def get_waiting_room_snapshot():
    return load_waiting_room_snapshot()


@router.post("/waiting-room/add-patient")
async def post_add_patient(payload: AddPatientRequest):
    patient = add_patient(
        full_name=payload.full_name,
        email=payload.email,
        temporary=payload.temporary,
        created_by_login_id=payload.created_by_login_id,
    )
    return {"ok": True, "message": "Patient added to waiting room.", "patient": patient}


@router.get("/patient/{patient_id}", response_model=PatientDetailResponse)
async def get_waiting_room_patient_detail(patient_id: str):
    try:
        return get_patient_detail(patient_id=patient_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/devices/available")
async def get_available_wearables():
    snapshot = load_waiting_room_snapshot()
    return {
        "schema_version": 1,
        "updated_at": snapshot.get("updated_at"),
        "devices": list_available_wearables(),
    }


@router.post("/devices/{device_id}/precheck", response_model=WearablePrecheckResponse)
async def post_wearable_precheck(device_id: str, payload: WearablePrecheckRequest):
    result = run_wearable_precheck(device_id=device_id, patient_id=payload.patient_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wearable not found.",
        )
    return result


@router.post("/waiting-room/{patient_id}/bind-device")
async def post_bind_wearable(patient_id: str, payload: BindWearableRequest):
    try:
        patient = bind_wearable(patient_id=patient_id, device_id=payload.device_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return {"ok": True, "message": "Wearable bound to patient.", "patient": patient}


@router.post("/waiting-room/{patient_id}/unbind-device", response_model=GenericDashboardAction)
async def post_unbind_wearable(patient_id: str):
    try:
        unbind_wearable(patient_id=patient_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return GenericDashboardAction(ok=True, message="Wearable unbound from patient.")


@router.get("/waiting-room/{patient_id}/pairing-status", response_model=PairingStatusResponse)
async def get_patient_pairing_status(patient_id: str):
    try:
        return get_pairing_status(patient_id=patient_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/waiting-room/{patient_id}/release", response_model=GenericDashboardAction)
async def post_release_patient(patient_id: str):
    try:
        release_patient(patient_id=patient_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return GenericDashboardAction(ok=True, message="Patient released and wearable disconnected.")


@router.get("/device-health")
async def get_device_health_snapshot():
    return load_device_health_snapshot()


@router.get("/history/critical-moments")
async def get_critical_moments_snapshot():
    return get_critical_moments_history()
