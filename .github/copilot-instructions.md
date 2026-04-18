# Kinovo: Resilient Medical Infrastructure Constitution

## The Mission

Kinovo is a disruptive, sustainable alternative to $30k+ emergency monitors. We empower hospitals and clinics in low-resource environments with high-reliability patient monitoring inside waiting-room and intake workflows.

## Core Architectural Pillars

1. **Asynchronous Resilience (Store-and-Forward):** The network is never guaranteed. Data must be locally cached (Circular Buffer) during dead zones and "backfilled" automatically to the hospital upon reconnection.
2. **Infrastructure over Luxury:** Prioritize battery life, sensor accuracy (BPM, SpO2, Stress), and data integrity over UI animations or non-essential features.
3. **Hardware Strategy:** Our proprietary Wristband is the "Source of Truth." It serves as a secure, ruggedized bridge until we can safely integrate with third-party consumer smartwatches.
4. **Security & Accountability:** We are creating a legal medical record. Data must be encrypted at the edge (on-device) and validated for integrity before ingestion.

## Technical Constraints

- Hardware: ESP32-based low-power nodes.
- Protocol: BLE with custom GATT services for bulk data transfer.
- Core Clinical Schema (Current Phase): {patientName, vitals: {bloodOxygen, stress, heartBeat}, timestamp}.
- Transport Envelope Metadata (store-and-forward): {patientId, transportMeta: {recordId, sequenceNumber, checksum, ackState, retryCount, essentialVitalsOnly, bufferedDuringDeadZone, backfillBatchId}}.
- Timestamp Standard: ISO-8601 UTC (prefer millisecond precision).
- Location Fields: deferred for current waiting-room phase; do not add location to dashboard card/detail schema unless explicitly requested.

## Pillar 5 - Frontend & Interaction (The Triage Dashboard)

1. **Acuity-Based Hierarchy:** The UI is not a list; it is a live triage queue. Sorting logic must be: `is_critical DESC, spo2 ASC, timestamp DESC`.
2. **The "Pulse" Indicator:** Every patient card must show a "last updated" indicator. If data is older than 10 seconds, the UI must visually dim the vitals to indicate "Stale Data."
3. **Backfill Visibility (Deferred):** The UI distinction between live "real-time" streaming and "recovered" data from a dead-zone is intentionally deferred for the current phase. Do not prioritize the "History" badge right now; keep the schema compatibility (`bufferedDuringDeadZone`) so the badge can be enabled in a future phase.
4. **Zero-Click Pairing:** The workflow for linking a physical Arduino (MAC address/ID) to a digital patient record must be achievable in under 3 taps.
5. **Role-Based Views:**
   - **Staff View:** Focus on live vitals and quick-action buttons (Check-in/Release).
   - **Admin View:** Focus on "Wait Time" analytics and "Device Battery" health across the fleet.
6. **Current Clinical Context:** This phase is strictly waiting-room and nurse-intake monitoring. Do not model ambulance transport locations in UI schemas for this phase.
