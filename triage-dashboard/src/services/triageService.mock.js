const mockData = {
  scenarios: [
    {
      scenarioId: "WR_STABLE_001",
      records: [
        {
          patientName: "Jordan Miles",
          patientId: "pt_8f3b21",
          vitals: { bloodOxygen: 97, stress: 35, heartBeat: 75 },
          timestamp: "2026-04-08T08:01:00.000Z",
          transportMeta: {
            recordId: "rec_stable_0003",
            sequenceNumber: 3,
            checksum: "d18f40ae",
            ackState: "acknowledged",
            retryCount: 0,
            essentialVitalsOnly: false,
            bufferedDuringDeadZone: false,
            backfillBatchId: null,
          },
        },
      ],
    },
    {
      scenarioId: "WR_HYPOXIA_002",
      records: [
        {
          patientName: "Rina Patel",
          patientId: "pt_7ca901",
          vitals: { bloodOxygen: 87, stress: 72, heartBeat: 118 },
          timestamp: "2026-04-08T09:11:00.000Z",
          transportMeta: {
            recordId: "rec_hypoxia_0003",
            sequenceNumber: 3,
            checksum: "1f4ce8a1",
            ackState: "acknowledged",
            retryCount: 0,
            essentialVitalsOnly: true,
            bufferedDuringDeadZone: false,
            backfillBatchId: null,
          },
        },
      ],
    },
    {
      scenarioId: "WR_HIGH_ACUITY_003",
      records: [
        {
          patientName: "Elias Romero",
          patientId: "pt_23de11",
          vitals: { bloodOxygen: 89, stress: 94, heartBeat: 141 },
          timestamp: "2026-04-08T10:15:30.000Z",
          transportMeta: {
            recordId: "rec_trauma_0002",
            sequenceNumber: 2,
            checksum: "ee4917b5",
            ackState: "acknowledged",
            retryCount: 0,
            essentialVitalsOnly: true,
            bufferedDuringDeadZone: false,
            backfillBatchId: null,
          },
        },
      ],
    },
    {
      scenarioId: "WR_BUFFERED_004",
      records: [
        {
          patientName: "Maya Brooks",
          patientId: "pt_5ac884",
          vitals: { bloodOxygen: 95, stress: 51, heartBeat: 86 },
          timestamp: "2026-04-08T11:30:00.000Z",
          transportMeta: {
            recordId: "rec_deadzone_0004",
            sequenceNumber: 4,
            checksum: "d71be54e",
            ackState: "acknowledged",
            retryCount: 1,
            essentialVitalsOnly: false,
            bufferedDuringDeadZone: true,
            backfillBatchId: "batch_20260408_1100",
          },
        },
      ],
    },
    {
      scenarioId: "WR_RETRY_005",
      records: [
        {
          patientName: "Noah Singh",
          patientId: "pt_11fbb8",
          vitals: { bloodOxygen: 96, stress: 43, heartBeat: 81 },
          timestamp: "2026-04-08T12:06:00.000Z",
          transportMeta: {
            recordId: "rec_shaky_0003",
            sequenceNumber: 3,
            checksum: "f34c5bbd",
            ackState: "acknowledged",
            retryCount: 2,
            essentialVitalsOnly: false,
            bufferedDuringDeadZone: true,
            backfillBatchId: "batch_20260408_1205",
          },
        },
      ],
    },
    {
      scenarioId: "WR_SENSOR_DROPOUT_006",
      records: [
        {
          patientName: "Leah Kim",
          patientId: "pt_90ce44",
          vitals: { bloodOxygen: 97, stress: null, heartBeat: 82 },
          timestamp: "2026-04-08T12:45:30.000Z",
          transportMeta: {
            recordId: "rec_dropout_0002",
            sequenceNumber: 2,
            checksum: "1d74f7c9",
            ackState: "acknowledged",
            retryCount: 0,
            essentialVitalsOnly: true,
            bufferedDuringDeadZone: false,
            backfillBatchId: null,
          },
        },
      ],
    },
    {
      scenarioId: "WR_AGE_EDGECASES_007",
      records: [
        {
          patientName: "Harold Finch",
          patientId: "pt_6d1ab2",
          vitals: { bloodOxygen: 95, stress: 47, heartBeat: 52 },
          timestamp: "2026-04-08T13:10:00.000Z",
          transportMeta: {
            recordId: "rec_age_0001",
            sequenceNumber: 1,
            checksum: "9fcd1024",
            ackState: "acknowledged",
            retryCount: 0,
            essentialVitalsOnly: false,
            bufferedDuringDeadZone: false,
            backfillBatchId: null,
          },
        },
        {
          patientName: "Aria Gomez",
          patientId: "pt_f1310e",
          vitals: { bloodOxygen: 99, stress: 55, heartBeat: 122 },
          timestamp: "2026-04-08T13:10:30.000Z",
          transportMeta: {
            recordId: "rec_age_0002",
            sequenceNumber: 2,
            checksum: "5be7d8a2",
            ackState: "acknowledged",
            retryCount: 0,
            essentialVitalsOnly: false,
            bufferedDuringDeadZone: false,
            backfillBatchId: null,
          },
        },
      ],
    },
  ],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const withUiState = (record, previousHeartBeat = record.vitals.heartBeat) => {
  const bpmDelta = Math.abs(record.vitals.heartBeat - previousHeartBeat);
  const isCritical = record.vitals.bloodOxygen < 90 || bpmDelta > 20;

  return {
    ...record,
    uiState: {
      isCritical,
      criticalReason:
        record.vitals.bloodOxygen < 90
          ? "Critical oxygen drop"
          : bpmDelta > 20
            ? "Rapid heartbeat spike"
            : "Stable",
      bpmDelta,
      lastUpdatedSeconds: 0,
      isStale: false,
      streamType: record.transportMeta.bufferedDuringDeadZone
        ? "history"
        : "realtime",
    },
  };
};

const buildDeviceHealth = (patientId, sequenceNumber) => ({
  deviceId: `wearable-${patientId.slice(-4)}`,
  batteryLevel: clamp(92 - sequenceNumber * 2, 25, 99),
  signalStrength: clamp(-58 - sequenceNumber * 2, -95, -45),
  lastSyncTime: new Date().toISOString(),
});

export const buildInitialQueueFromMockData = () => {
  const latestByPatient = new Map();

  mockData.scenarios.forEach((scenario) => {
    scenario.records.forEach((record) => {
      const existing = latestByPatient.get(record.patientId);
      if (!existing || existing.timestamp < record.timestamp) {
        latestByPatient.set(record.patientId, record);
      }
    });
  });

  return Array.from(latestByPatient.values()).map((record) => {
    const envelope = withUiState(record);
    return {
      patientId: record.patientId,
      patientName: record.patientName,
      patientEmail: `${record.patientName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      waitStartedAt: record.timestamp,
      clinicalPayload: {
        name: record.patientName,
        vitals: record.vitals,
        timestamp: record.timestamp,
      },
      transportMeta: {
        ...record.transportMeta,
        ...buildDeviceHealth(
          record.patientId,
          record.transportMeta.sequenceNumber,
        ),
      },
      uiState: envelope.uiState,
    };
  });
};

export const sortTriageQueue = (patients) =>
  [...patients].sort((a, b) => {
    if (a.uiState.isCritical !== b.uiState.isCritical) {
      return Number(b.uiState.isCritical) - Number(a.uiState.isCritical);
    }

    if (
      a.clinicalPayload.vitals.bloodOxygen !==
      b.clinicalPayload.vitals.bloodOxygen
    ) {
      return (
        a.clinicalPayload.vitals.bloodOxygen -
        b.clinicalPayload.vitals.bloodOxygen
      );
    }

    if (a.clinicalPayload.timestamp !== b.clinicalPayload.timestamp) {
      return b.clinicalPayload.timestamp.localeCompare(
        a.clinicalPayload.timestamp,
      );
    }

    return a.patientId.localeCompare(b.patientId);
  });

export const tickPatientTelemetry = (patient) => {
  const previousVitals = patient.clinicalPayload.vitals;
  const spikeRoll = Math.random();
  const oxygenDropRoll = Math.random();

  const heartBeatShift =
    spikeRoll < 0.09
      ? Math.floor(22 + Math.random() * 15)
      : Math.floor(Math.random() * 9) - 4;

  const oxygenShift =
    oxygenDropRoll < 0.08
      ? -Math.floor(3 + Math.random() * 4)
      : Math.floor(Math.random() * 3) - 1;

  const nextHeartBeat = clamp(
    previousVitals.heartBeat + heartBeatShift,
    38,
    170,
  );
  const nextBloodOxygen = clamp(
    previousVitals.bloodOxygen + oxygenShift,
    82,
    100,
  );
  const nextStress = clamp(
    Math.round(
      (nextHeartBeat - 60) * 0.7 +
        (100 - nextBloodOxygen) * 1.8 +
        Math.random() * 12,
    ),
    5,
    99,
  );

  const timestamp = new Date().toISOString();
  const bpmDelta = Math.abs(nextHeartBeat - previousVitals.heartBeat);
  const isCritical = nextBloodOxygen < 90 || bpmDelta > 20;

  return {
    ...patient,
    clinicalPayload: {
      ...patient.clinicalPayload,
      timestamp,
      vitals: {
        heartBeat: nextHeartBeat,
        bloodOxygen: nextBloodOxygen,
        stress: nextStress,
      },
    },
    transportMeta: {
      ...patient.transportMeta,
      sequenceNumber: (patient.transportMeta.sequenceNumber ?? 0) + 1,
      batteryLevel: clamp(
        patient.transportMeta.batteryLevel - Math.random() * 0.3,
        5,
        100,
      ),
      signalStrength: clamp(
        patient.transportMeta.signalStrength + (Math.random() > 0.5 ? 1 : -1),
        -96,
        -44,
      ),
      lastSyncTime: timestamp,
      bufferedDuringDeadZone: Math.random() < 0.05,
    },
    uiState: {
      isCritical,
      criticalReason:
        nextBloodOxygen < 90
          ? "Critical oxygen drop"
          : bpmDelta > 20
            ? "Rapid heartbeat spike"
            : "Stable",
      bpmDelta,
      lastUpdatedSeconds: 0,
      isStale: false,
      streamType: Math.random() < 0.05 ? "history" : "realtime",
    },
  };
};

export const updateStaleness = (patient, staleThresholdSeconds = 10) => {
  const ageSeconds = Math.floor(
    (Date.now() - new Date(patient.clinicalPayload.timestamp).getTime()) / 1000,
  );

  return {
    ...patient,
    uiState: {
      ...patient.uiState,
      lastUpdatedSeconds: Math.max(ageSeconds, 0),
      isStale: ageSeconds > staleThresholdSeconds,
    },
  };
};

export const buildPatientFromRegisteredAccount = (account) => {
  const timestamp = new Date().toISOString();

  return {
    patientId: `pt_${crypto.randomUUID().slice(0, 6)}`,
    patientName: account.fullName,
    patientEmail: account.email,
    waitStartedAt: timestamp,
    clinicalPayload: {
      name: account.fullName,
      timestamp,
      vitals: {
        heartBeat: 82,
        bloodOxygen: 97,
        stress: 24,
      },
    },
    transportMeta: {
      recordId: `rec_${crypto.randomUUID().slice(0, 8)}`,
      sequenceNumber: 1,
      checksum: "pending-backend-checksum",
      ackState: "pending",
      retryCount: 0,
      essentialVitalsOnly: false,
      bufferedDuringDeadZone: false,
      backfillBatchId: null,
      deviceId: `wearable-${crypto.randomUUID().slice(0, 4)}`,
      batteryLevel: 89,
      signalStrength: -62,
      lastSyncTime: timestamp,
    },
    uiState: {
      isCritical: false,
      criticalReason: "Stable",
      bpmDelta: 0,
      lastUpdatedSeconds: 0,
      isStale: false,
      streamType: "realtime",
    },
    accountMeta: {
      loginId: account.loginId,
      temporary: Boolean(account.temporary),
      status: account.status ?? "active",
    },
  };
};
