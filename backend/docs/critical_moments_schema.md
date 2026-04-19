# Critical Moments Data Design

This document defines the dual-path storage design for patient critical moments:

- **Hackathon mode (JSON):** `backend/data/critical_moments.history.json`
- **Production mode (Postgres):** `critical_moments` table (DDL below)

## JSON Structure

```json
{
  "schema_version": 1,
  "updated_at": "2026-04-19T03:31:24.437772Z",
  "moments": [
    {
      "eventId": "cm_pt_273f7e_183",
      "patientId": "pt_273f7e",
      "patientName": "Swayam Pharate",
      "deviceId": "wearable-demo-a",
      "occurredAt": "2026-04-19T01:50:01.562440Z",
      "reason": "low_spo2",
      "observedValue": {
        "bloodOxygen": 89,
        "heartBeat": 102,
        "stress": 41
      },
      "beforeSeconds": 3,
      "afterSeconds": 3,
      "windowBefore": [],
      "windowAfter": [],
      "severity": "critical"
    }
  ]
}
```

## Postgres Table (Proposed)

```sql
create table if not exists critical_moments (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  patient_id uuid not null,
  device_id uuid null,
  occurred_at timestamptz not null,
  reason text not null,
  severity text not null default 'critical',

  observed_blood_oxygen smallint not null,
  observed_heart_beat smallint not null,
  observed_stress numeric(5,2) null,

  before_seconds smallint not null default 3,
  after_seconds smallint not null default 3,
  window_before_json jsonb not null,
  window_after_json jsonb not null,

  created_at timestamptz not null default now()
);

create index if not exists idx_critical_moments_patient_time
  on critical_moments (patient_id, occurred_at desc);

create index if not exists idx_critical_moments_occurred_at
  on critical_moments (occurred_at desc);

create index if not exists idx_critical_moments_reason
  on critical_moments (reason);
```

## Notes

- `event_id` mirrors the frontend/runtime event identity for stable references.
- Windowed context is preserved in JSONB for rapid retrieval in timeline views.
- If a stricter normalized model is needed later, split window rows into a child table `critical_moment_samples`.
