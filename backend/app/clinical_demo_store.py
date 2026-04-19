from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SEED_FILE = DATA_DIR / "kinovo.dashboard.seed.json"


def _read_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def _clamp(value: float, min_value: float, max_value: float) -> float:
    return min(max_value, max(min_value, value))


def _timestamp_at(start: str, seconds: int) -> str:
    base = datetime.fromisoformat(start.replace("Z", "+00:00"))
    return (base + timedelta(seconds=seconds)).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _build_vitals(base: dict, drift: dict, second: int, event_reason: str | None) -> dict:
    blood_oxygen = base["bloodOxygen"] + (drift["bloodOxygen"] * second)
    heart_beat = base["heartBeat"] + (drift["heartBeat"] * second)
    stress = base["stress"] + (drift["stress"] * second)

    if event_reason == "low_spo2":
        blood_oxygen -= 5 + max(0, 3 - abs(second % 4 - 2))
        heart_beat += 6
        stress += 8
    elif event_reason == "oxygen_drop":
        blood_oxygen -= 6 + max(0, 4 - abs(second % 4 - 2))
        heart_beat += 5
        stress += 7
    elif event_reason == "high_heart_rate":
        heart_beat += 24 + max(0, 3 - abs(second % 4 - 2))
        blood_oxygen -= 2
        stress += 10
    elif event_reason == "tachycardia":
        heart_beat += 26 + max(0, 4 - abs(second % 4 - 2))
        blood_oxygen -= 1
        stress += 12

    return {
        "bloodOxygen": int(round(_clamp(blood_oxygen, 82, 100))),
        "heartBeat": int(round(_clamp(heart_beat, 42, 180))),
        "stress": int(round(_clamp(stress, 0, 100))),
    }


def _resolve_event_reason(critical_events: list[dict], second: int) -> str | None:
    for event in critical_events:
        start = event["atSecond"] - event.get("beforeSeconds", 3)
        end = event["atSecond"] + event.get("afterSeconds", 3)
        if start <= second <= end:
            return event["reason"]
    return None


def _build_history(patient: dict) -> tuple[list[dict], list[dict]]:
    ingest_plan = patient.get("ingestPlan", {})
    start_at = ingest_plan["startAt"]
    seconds = int(ingest_plan.get("seconds", 100))
    base = ingest_plan.get("baseVitals", patient["clinicalPayload"]["vitals"])
    drift = ingest_plan.get("driftPerSecond", {"bloodOxygen": 0, "heartBeat": 0, "stress": 0})
    critical_events = ingest_plan.get("criticalEvents", [])

    history = []
    critical_moments = []

    for second in range(seconds):
      
        event_reason = _resolve_event_reason(critical_events, second)
        timestamp = _timestamp_at(start_at, second)
        vitals = _build_vitals(base, drift, second, event_reason)
        is_critical = vitals["bloodOxygen"] < 90 or vitals["heartBeat"] >= 120

        history.append(
            {
                "timestamp": timestamp,
                "vitals": vitals,
                "source": "observed",
                "isCritical": is_critical,
                "eventReason": event_reason,
            }
        )

    for event in critical_events:
        event_index = int(event["atSecond"])
        before_seconds = int(event.get("beforeSeconds", 3))
        after_seconds = int(event.get("afterSeconds", 3))
        event_sample = history[event_index]

        critical_moments.append(
            {
                "eventId": f"cm_{patient['patientId']}_{event_index}",
                "patientId": patient["patientId"],
                "deviceId": patient["transportMeta"]["deviceId"],
                "occurredAt": event_sample["timestamp"],
                "reason": event["reason"],
                "observedValue": event_sample["vitals"],
                "beforeSeconds": before_seconds,
                "afterSeconds": after_seconds,
                "windowBefore": history[max(0, event_index - before_seconds) : event_index],
                "windowAfter": history[event_index + 1 : event_index + 1 + after_seconds],
                "severity": "critical" if event_sample["isCritical"] else "warning",
            }
        )

    return history, critical_moments


def load_dashboard_snapshot() -> dict:
    payload = _read_json(SEED_FILE)
    snapshot = deepcopy(payload)
    patients = []

    for patient in snapshot.get("patients", []):
        history, critical_moments = _build_history(patient)
        latest = history[-1]
        patient["clinicalPayload"]["timestamp"] = latest["timestamp"]
        patient["clinicalPayload"]["vitals"] = latest["vitals"]
        patient["clinicalPayload"]["history"] = history
        patient["criticalMoments"] = critical_moments
        patient["uiState"]["isCritical"] = latest["isCritical"]
        patient["uiState"]["criticalReason"] = (
            "Critical oxygen drop"
            if latest["vitals"]["bloodOxygen"] < 90
            else "Rapid heartbeat spike"
            if latest["vitals"]["heartBeat"] >= 120
            else patient["uiState"].get("criticalReason", "Stable")
        )
        patient["transportMeta"]["lastSyncTime"] = latest["timestamp"]
        patients.append(patient)

    return {
        "schema_version": snapshot.get("schema_version", 1),
        "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "patients": patients,
    }


def load_device_snapshot() -> dict:
    dashboard = load_dashboard_snapshot()
    devices = []

    for patient in dashboard["patients"]:
        devices.append(
            {
                "device_id": patient["transportMeta"]["deviceId"],
                "patient_id": patient["patientId"],
                "patient_name": patient["patientName"],
                "battery_level": patient["transportMeta"].get("batteryLevel"),
                "signal_strength": patient["transportMeta"].get("signalStrength"),
                "last_sync_time": patient["transportMeta"].get("lastSyncTime"),
                "is_active": True,
                "connection_status": patient["transportMeta"].get("connectionStatus", "connected"),
            }
        )

    return {
        "schema_version": 1,
        "updated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "devices": devices,
    }
