from __future__ import annotations

import json
import math
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

from app.clinical_demo_store import load_dashboard_snapshot

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
RUNTIME_FILE = DATA_DIR / "dashboard.runtime.json"
CRITICAL_MOMENTS_FILE = DATA_DIR / "critical_moments.history.json"

ACTIVE_READ_THRESHOLD_MS = 10_000
LOW_BATTERY_THRESHOLD = 10
SIMULATION_POINT_COUNT = 200

_DEFAULT_WEARABLES = [
    {
        "wearableId": "wearable-k102",
        "batteryLevel": 86,
        "signalStrength": -60,
        "activeReadsEnabled": True,
        "lastReadAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "assignedPatientId": None,
    },
    {
        "wearableId": "wearable-k233",
        "batteryLevel": 8,
        "signalStrength": -72,
        "activeReadsEnabled": True,
        "lastReadAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "assignedPatientId": None,
    },
    {
        "wearableId": "wearable-k301",
        "batteryLevel": 65,
        "signalStrength": -68,
        "activeReadsEnabled": False,
        "lastReadAt": None,
        "assignedPatientId": None,
    },
    {
        "wearableId": "wearable-k417",
        "batteryLevel": 42,
        "signalStrength": -81,
        "activeReadsEnabled": True,
        "lastReadAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "assignedPatientId": None,
    },
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _sort_patients(patients: list[dict]) -> list[dict]:
    def _safe_spo2(patient: dict) -> int:
        spo2 = patient.get("clinicalPayload", {}).get("vitals", {}).get("bloodOxygen")
        return int(spo2) if isinstance(spo2, (int, float)) else 100

    def _safe_timestamp(patient: dict) -> float:
        timestamp = patient.get("clinicalPayload", {}).get("timestamp")
        if not timestamp:
            return 0.0
        return datetime.fromisoformat(timestamp.replace("Z", "+00:00")).timestamp()

    return sorted(
        patients,
        key=lambda patient: (
            0 if patient.get("uiState", {}).get("isCritical") else 1,
            _safe_spo2(patient),
            -_safe_timestamp(patient),
            patient.get("patientId", ""),
        ),
    )


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return min(max_value, max(min_value, value))


def _build_simulation_history(*, patient_id: str, start_at: str, base_vitals: dict) -> list[dict]:
    start_dt = datetime.fromisoformat(start_at.replace("Z", "+00:00"))
    history: list[dict] = []
    seed = sum(ord(char) for char in patient_id) % 31

    for second in range(SIMULATION_POINT_COUNT):
        phase = (second + seed) / 10.0
        blood_oxygen = base_vitals["bloodOxygen"] + 2.2 * math.sin(phase / 1.9)
        heart_beat = base_vitals["heartBeat"] + 8.5 * math.sin(phase) + 4.0 * math.sin(phase / 2.7)
        stress = base_vitals["stress"] + 10.5 * math.sin(phase / 1.5) + max(0, heart_beat - 95) * 0.35

        if second % 73 in {34, 35, 36, 37}:
            blood_oxygen -= 6
            heart_beat += 8
            stress += 7

        vitals = {
            "bloodOxygen": int(round(_clamp(blood_oxygen, 82, 100))),
            "heartBeat": int(round(_clamp(heart_beat, 44, 170))),
            "stress": int(round(_clamp(stress, 5, 100))),
        }
        is_critical = vitals["bloodOxygen"] < 90 or vitals["heartBeat"] >= 120
        event_reason = (
            "low_spo2"
            if vitals["bloodOxygen"] < 90
            else "high_heart_rate"
            if vitals["heartBeat"] >= 120
            else None
        )

        history.append(
            {
                "timestamp": (start_dt + timedelta(seconds=second)).astimezone(timezone.utc).isoformat().replace(
                    "+00:00", "Z"
                ),
                "vitals": vitals,
                "source": "observed",
                "isCritical": is_critical,
                "eventReason": event_reason,
            }
        )

    return history


def _apply_history_cursor(patient: dict, cursor: int, observed_at_iso: str) -> None:
    history = patient.get("clinicalPayload", {}).get("history", [])
    if not history:
        return

    point = history[cursor % len(history)]
    vitals = point["vitals"]
    signed_bpm_delta = vitals["heartBeat"] - int(patient.get("clinicalPayload", {}).get("vitals", {}).get("heartBeat") or vitals["heartBeat"])
    bpm_delta = abs(signed_bpm_delta)
    is_critical = bool(point.get("isCritical"))

    patient.setdefault("clinicalPayload", {}).update(
        {
            "timestamp": observed_at_iso,
            "sampleTimestamp": point.get("timestamp"),
            "vitals": vitals,
        }
    )
    patient.setdefault("transportMeta", {}).update(
        {
            "lastSyncTime": observed_at_iso,
            "activeReadsHealthy": True,
            "connectionStatus": "connected",
        }
    )
    patient.setdefault("uiState", {}).update(
        {
            "isCritical": is_critical,
            "criticalReason": (
                "Critical oxygen drop"
                if vitals["bloodOxygen"] < 90
                else "Rapid heartbeat spike"
                if vitals["heartBeat"] >= 120
                else "Stable"
            ),
            "bpmDelta": bpm_delta,
            "signedBpmDelta": signed_bpm_delta,
            "heartBeatDirection": "rising" if signed_bpm_delta > 0 else "falling" if signed_bpm_delta < 0 else "steady",
            "monitoringStatus": "Live reads active",
            "stale": False,
        }
    )


def _advance_patient_simulation(payload: dict, patient: dict) -> None:
    transport = patient.get("transportMeta", {})
    if transport.get("connectionStatus") != "connected" or not transport.get("deviceId"):
        return

    history = patient.get("clinicalPayload", {}).get("history", [])
    if len(history) != SIMULATION_POINT_COUNT:
        current = patient.get("clinicalPayload", {}).get("vitals", {})
        base_vitals = {
            "bloodOxygen": int(current.get("bloodOxygen") or 97),
            "heartBeat": int(current.get("heartBeat") or 82),
            "stress": int(current.get("stress") or 24),
        }
        patient.setdefault("clinicalPayload", {})["history"] = _build_simulation_history(
            patient_id=patient.get("patientId", "pt_unknown"),
            start_at=_now_iso(),
            base_vitals=base_vitals,
        )
        history = patient.get("clinicalPayload", {}).get("history", [])
        patient["simulation"] = {
            "active": True,
            "cursor": -1,
            "pointCount": len(history),
            "loopCount": 0,
        }

    if not history:
        return

    simulation = patient.setdefault(
        "simulation",
        {
            "active": True,
            "cursor": -1,
            "pointCount": len(history),
            "loopCount": 0,
        },
    )

    if not simulation.get("active", True):
        return

    point_count = max(1, int(simulation.get("pointCount") or len(history) or 1))
    next_cursor = (int(simulation.get("cursor", -1)) + 1) % point_count
    if next_cursor == 0 and int(simulation.get("cursor", -1)) >= 0:
        simulation["loopCount"] = int(simulation.get("loopCount", 0)) + 1

    simulation["cursor"] = next_cursor
    simulation["pointCount"] = point_count
    observed_at_iso = _now_iso()

    _apply_history_cursor(patient, next_cursor, observed_at_iso)

    wearable = _find_wearable(payload, transport.get("deviceId"))
    if wearable:
        wearable["lastReadAt"] = observed_at_iso
        wearable["assignedPatientId"] = patient.get("patientId")
        wearable["activeReadsEnabled"] = True
        battery_level = wearable.get("batteryLevel")
        if isinstance(battery_level, (int, float)):
            wearable["batteryLevel"] = max(1, min(100, int(round(battery_level - 0.04))))
        transport["batteryLevel"] = wearable.get("batteryLevel")
        transport["signalStrength"] = wearable.get("signalStrength")


def _seed_runtime_payload() -> dict:
    snapshot = load_dashboard_snapshot()
    patients = snapshot.get("patients", [])

    wearable_inventory = deepcopy(_DEFAULT_WEARABLES)
    for patient in patients:
        device_id = patient.get("transportMeta", {}).get("deviceId")
        if not device_id:
            continue
        existing = next((wearable for wearable in wearable_inventory if wearable["wearableId"] == device_id), None)
        if existing:
            existing["assignedPatientId"] = patient["patientId"]
            existing["batteryLevel"] = patient.get("transportMeta", {}).get("batteryLevel") or existing["batteryLevel"]
            existing["signalStrength"] = patient.get("transportMeta", {}).get("signalStrength") or existing["signalStrength"]
            existing["lastReadAt"] = patient.get("transportMeta", {}).get("lastSyncTime") or existing["lastReadAt"]
            continue

        wearable_inventory.append(
            {
                "wearableId": device_id,
                "batteryLevel": patient.get("transportMeta", {}).get("batteryLevel") or 90,
                "signalStrength": patient.get("transportMeta", {}).get("signalStrength") or -60,
                "activeReadsEnabled": True,
                "lastReadAt": patient.get("transportMeta", {}).get("lastSyncTime") or _now_iso(),
                "assignedPatientId": patient.get("patientId"),
            }
        )

    return {
        "schema_version": snapshot.get("schema_version", 1),
        "updated_at": _now_iso(),
        "patients": _sort_patients(patients),
        "wearableInventory": wearable_inventory,
    }


def _read_runtime_payload() -> dict:
    if not RUNTIME_FILE.exists():
        payload = _seed_runtime_payload()
        _write_runtime_payload(payload)
        return payload

    with RUNTIME_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def _read_critical_moments_payload() -> dict:
    if not CRITICAL_MOMENTS_FILE.exists():
        return {
            "schema_version": 1,
            "updated_at": _now_iso(),
            "moments": [],
        }

    with CRITICAL_MOMENTS_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def _write_runtime_payload(payload: dict) -> None:
    payload["updated_at"] = _now_iso()
    with RUNTIME_FILE.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)
        file.write("\n")


def _write_critical_moments_payload(payload: dict) -> None:
    payload["updated_at"] = _now_iso()
    with CRITICAL_MOMENTS_FILE.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)
        file.write("\n")


def _resolve_critical_reason(point: dict) -> str:
    explicit = point.get("eventReason")
    if explicit:
        return explicit

    vitals = point.get("vitals", {})
    spo2 = vitals.get("bloodOxygen")
    bpm = vitals.get("heartBeat")
    if isinstance(spo2, (int, float)) and spo2 < 90:
        return "low_spo2"
    if isinstance(bpm, (int, float)) and bpm >= 120:
        return "high_heart_rate"
    return "threshold_cross"


def _extract_critical_moments(payload: dict) -> list[dict]:
    moments: list[dict] = []
    for patient in payload.get("patients", []):
        history = patient.get("clinicalPayload", {}).get("history", [])
        if not history:
            continue

        for index, point in enumerate(history):
            if not point.get("isCritical"):
                continue

            before_seconds = 3
            after_seconds = 3
            window_before = history[max(0, index - before_seconds): index]
            window_after = history[index + 1: index + 1 + after_seconds]
            vitals = point.get("vitals", {})

            moments.append(
                {
                    "eventId": f"cm_{patient.get('patientId')}_{index}",
                    "patientId": patient.get("patientId"),
                    "patientName": patient.get("patientName"),
                    "deviceId": patient.get("transportMeta", {}).get("deviceId"),
                    "occurredAt": point.get("timestamp"),
                    "reason": _resolve_critical_reason(point),
                    "observedValue": vitals,
                    "beforeSeconds": before_seconds,
                    "afterSeconds": after_seconds,
                    "windowBefore": window_before,
                    "windowAfter": window_after,
                    "severity": "critical",
                }
            )

    moments.sort(
        key=lambda moment: datetime.fromisoformat(
            (moment.get("occurredAt") or "1970-01-01T00:00:00Z").replace("Z", "+00:00")
        ),
        reverse=True,
    )
    return moments


def _refresh_critical_moments_store(payload: dict) -> None:
    moments = _extract_critical_moments(payload)
    _write_critical_moments_payload(
        {
            "schema_version": payload.get("schema_version", 1),
            "updated_at": _now_iso(),
            "moments": moments,
        }
    )


def _find_patient(payload: dict, patient_id: str) -> dict | None:
    return next((patient for patient in payload.get("patients", []) if patient.get("patientId") == patient_id), None)


def _find_wearable(payload: dict, wearable_id: str) -> dict | None:
    return next(
        (
            wearable
            for wearable in payload.get("wearableInventory", [])
            if wearable.get("wearableId") == wearable_id
        ),
        None,
    )


def get_waiting_room_snapshot() -> dict:
    payload = _read_runtime_payload()

    for patient in payload.get("patients", []):
        _advance_patient_simulation(payload, patient)

    payload["patients"] = _sort_patients(payload.get("patients", []))
    _refresh_critical_moments_store(payload)
    _write_runtime_payload(payload)

    return {
        "schema_version": payload.get("schema_version", 1),
        "updated_at": payload.get("updated_at", _now_iso()),
        "patients": payload.get("patients", []),
    }


def get_device_health_snapshot() -> dict:
    payload = _read_runtime_payload()
    patients_by_id = {patient["patientId"]: patient for patient in payload.get("patients", [])}

    devices = []
    for wearable in payload.get("wearableInventory", []):
        patient = patients_by_id.get(wearable.get("assignedPatientId"))
        connection_status = "unpaired"
        if patient:
            connection_status = patient.get("transportMeta", {}).get("connectionStatus", "connected")

        devices.append(
            {
                "device_id": wearable.get("wearableId"),
                "patient_id": patient.get("patientId") if patient else None,
                "patient_name": patient.get("patientName") if patient else None,
                "battery_level": wearable.get("batteryLevel"),
                "signal_strength": wearable.get("signalStrength"),
                "last_sync_time": wearable.get("lastReadAt"),
                "is_active": True,
                "connection_status": connection_status,
            }
        )

    return {
        "schema_version": payload.get("schema_version", 1),
        "updated_at": payload.get("updated_at", _now_iso()),
        "devices": devices,
    }


def add_patient(*, full_name: str, email: str, temporary: bool, created_by_login_id: str) -> dict:
    payload = _read_runtime_payload()
    now = _now_iso()
    patient_id = f"pt_{uuid4().hex[:6]}"

    new_patient = {
        "patientId": patient_id,
        "patientName": full_name,
        "patientEmail": email,
        "waitStartedAt": now,
        "clinicalPayload": {
            "name": full_name,
            "timestamp": None,
            "vitals": {"bloodOxygen": None, "heartBeat": None, "stress": None},
            "history": [],
        },
        "transportMeta": {
            "deviceId": None,
            "batteryLevel": None,
            "signalStrength": None,
            "lastSyncTime": None,
            "pairedAt": None,
            "lowBatteryThreshold": LOW_BATTERY_THRESHOLD,
            "activeReadsHealthy": False,
            "connectionStatus": "unpaired",
            "createdByLoginId": created_by_login_id,
        },
        "uiState": {
            "isCritical": False,
            "criticalReason": "Stable",
            "bpmDelta": 0,
            "signedBpmDelta": 0,
            "heartBeatDirection": "steady",
            "monitoringStatus": "Pair wearable to begin active tracking",
            "stale": False,
        },
        "criticalMoments": [],
        "accountMeta": {
            "temporary": temporary,
            "status": "pending-registration" if temporary else "active",
        },
    }

    payload.setdefault("patients", []).append(new_patient)
    payload["patients"] = _sort_patients(payload["patients"])
    _refresh_critical_moments_store(payload)
    _write_runtime_payload(payload)
    return new_patient


def list_available_wearables() -> list[dict]:
    payload = _read_runtime_payload()
    return deepcopy(payload.get("wearableInventory", []))


def run_wearable_precheck(*, device_id: str, patient_id: str | None = None) -> dict | None:
    payload = _read_runtime_payload()
    wearable = _find_wearable(payload, device_id)
    if wearable is None:
        return None

    last_read_at = wearable.get("lastReadAt")
    if last_read_at:
        age_ms = max(
            int(
                (
                    datetime.now(timezone.utc)
                    - datetime.fromisoformat(last_read_at.replace("Z", "+00:00"))
                ).total_seconds()
                * 1000
            ),
            0,
        )
    else:
        age_ms = 10**9

    has_active_reads = bool(wearable.get("activeReadsEnabled"))
    battery_level = int(wearable.get("batteryLevel") or 0)
    battery_critical = battery_level < LOW_BATTERY_THRESHOLD

    return {
        "wearableId": wearable.get("wearableId"),
        "batteryLevel": battery_level,
        "signalStrength": wearable.get("signalStrength"),
        "lastReadAt": wearable.get("lastReadAt"),
        "hasActiveReads": has_active_reads,
        "batteryCritical": battery_critical,
        "lowBatteryThreshold": LOW_BATTERY_THRESHOLD,
        "connectionStatusLabel": "Ready" if has_active_reads else "Waiting for active reads",
        "patientId": patient_id,
    }


def bind_wearable(*, patient_id: str, device_id: str) -> dict:
    payload = _read_runtime_payload()
    patient = _find_patient(payload, patient_id)
    wearable = _find_wearable(payload, device_id)

    if patient is None:
        raise ValueError("Patient not found.")
    if wearable is None:
        raise ValueError("Wearable not found.")

    # Unassign wearable from any previous patient.
    previous_patient_id = wearable.get("assignedPatientId")
    if previous_patient_id and previous_patient_id != patient_id:
        previous = _find_patient(payload, previous_patient_id)
        if previous:
            previous["transportMeta"]["deviceId"] = None
            previous["transportMeta"]["connectionStatus"] = "unpaired"
            previous["transportMeta"]["activeReadsHealthy"] = False
            previous["transportMeta"]["batteryLevel"] = None
            previous["transportMeta"]["signalStrength"] = None
            previous["transportMeta"]["lastSyncTime"] = None
            previous["transportMeta"]["pairedAt"] = None

    precheck = run_wearable_precheck(device_id=device_id, patient_id=patient_id)
    if precheck is None:
        raise ValueError("Unable to run device precheck.")

    now = _now_iso()

    history = patient.get("clinicalPayload", {}).get("history", [])
    if not history:
        base_vitals = {
            "bloodOxygen": 97,
            "heartBeat": 82,
            "stress": 24,
        }
        patient.setdefault("clinicalPayload", {})["history"] = _build_simulation_history(
            patient_id=patient_id,
            start_at=now,
            base_vitals=base_vitals,
        )

    patient["simulation"] = {
        "active": True,
        "cursor": -1,
        "pointCount": len(patient.get("clinicalPayload", {}).get("history", [])),
        "loopCount": 0,
    }

    patient["transportMeta"].update(
        {
            "deviceId": device_id,
            "batteryLevel": precheck["batteryLevel"],
            "signalStrength": precheck["signalStrength"],
            "lastSyncTime": now,
            "pairedAt": now,
            "activeReadsHealthy": True,
            "connectionStatus": "connected",
        }
    )
    patient["uiState"]["monitoringStatus"] = "Live reads active"
    patient["uiState"]["isDischarged"] = False

    _advance_patient_simulation(payload, patient)

    wearable["assignedPatientId"] = patient_id
    wearable["lastReadAt"] = now
    wearable["activeReadsEnabled"] = True
    _refresh_critical_moments_store(payload)
    _write_runtime_payload(payload)
    return patient


def unbind_wearable(*, patient_id: str) -> dict:
    payload = _read_runtime_payload()
    patient = _find_patient(payload, patient_id)

    if patient is None:
        raise ValueError("Patient not found.")

    device_id = patient.get("transportMeta", {}).get("deviceId")
    if device_id:
        wearable = _find_wearable(payload, device_id)
        if wearable:
            wearable["assignedPatientId"] = None
            wearable["activeReadsEnabled"] = True

    patient["transportMeta"].update(
        {
            "deviceId": None,
            "batteryLevel": None,
            "signalStrength": None,
            "lastSyncTime": None,
            "pairedAt": None,
            "activeReadsHealthy": False,
            "connectionStatus": "unpaired",
        }
    )
    patient["uiState"]["monitoringStatus"] = "Pair wearable to begin active tracking"
    patient.setdefault("simulation", {})["active"] = False

    _refresh_critical_moments_store(payload)
    _write_runtime_payload(payload)
    return patient


def release_patient(*, patient_id: str) -> dict:
    payload = _read_runtime_payload()
    patient = _find_patient(payload, patient_id)

    if patient is None:
        raise ValueError("Patient not found.")

    device_id = patient.get("transportMeta", {}).get("deviceId")
    if device_id:
        wearable = _find_wearable(payload, device_id)
        if wearable:
            wearable["assignedPatientId"] = None
            wearable["activeReadsEnabled"] = True

    patient["transportMeta"].update(
        {
            "deviceId": None,
            "activeReadsHealthy": False,
            "connectionStatus": "disconnected",
        }
    )
    patient.setdefault("uiState", {})["isDischarged"] = True
    patient["uiState"]["monitoringStatus"] = "Released"
    patient.setdefault("simulation", {})["active"] = False

    _refresh_critical_moments_store(payload)
    _write_runtime_payload(payload)
    return patient


def get_critical_moments_history() -> dict:
    payload = _read_runtime_payload()
    _refresh_critical_moments_store(payload)
    return _read_critical_moments_payload()


def get_pairing_status(*, patient_id: str) -> dict:
    payload = _read_runtime_payload()
    patient = _find_patient(payload, patient_id)
    if patient is None:
        raise ValueError("Patient not found.")

    transport = patient.get("transportMeta", {})
    return {
        "patientId": patient_id,
        "connectionStatus": transport.get("connectionStatus", "unpaired"),
        "deviceId": transport.get("deviceId"),
        "activeReadsHealthy": bool(transport.get("activeReadsHealthy")),
        "lastSyncTime": transport.get("lastSyncTime"),
    }


def get_patient_detail(*, patient_id: str) -> dict:
    payload = _read_runtime_payload()
    patient = _find_patient(payload, patient_id)
    if patient is None:
        raise ValueError("Patient not found.")

    return {
        "schema_version": payload.get("schema_version", 1),
        "updated_at": payload.get("updated_at", _now_iso()),
        "patient": deepcopy(patient),
    }
