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
          deviceHealth: {
            deviceId: "wearable-b21",
            batteryLevel: 90,
            signalStrength: -58,
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
          deviceHealth: {
            deviceId: "wearable-901",
            batteryLevel: 84,
            signalStrength: -63,
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
          deviceHealth: {
            deviceId: "wearable-e11",
            batteryLevel: 80,
            signalStrength: -67,
          },
        },
      ],
    },
    {
      scenarioId: "WR_STABLE_004",
      records: [
        {
          patientName: "Maya Brooks",
          patientId: "pt_5ac884",
          vitals: { bloodOxygen: 95, stress: 51, heartBeat: 86 },
          timestamp: "2026-04-08T11:30:00.000Z",
          deviceHealth: {
            deviceId: "wearable-884",
            batteryLevel: 88,
            signalStrength: -60,
          },
        },
      ],
    },
    {
      scenarioId: "WR_STABLE_005",
      records: [
        {
          patientName: "Noah Singh",
          patientId: "pt_11fbb8",
          vitals: { bloodOxygen: 96, stress: 43, heartBeat: 81 },
          timestamp: "2026-04-08T12:06:00.000Z",
          deviceHealth: {
            deviceId: "wearable-bb8",
            batteryLevel: 86,
            signalStrength: -57,
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
          deviceHealth: {
            deviceId: "wearable-e44",
            batteryLevel: 83,
            signalStrength: -62,
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
          deviceHealth: {
            deviceId: "wearable-ab2",
            batteryLevel: 85,
            signalStrength: -61,
          },
        },
        {
          patientName: "Aria Gomez",
          patientId: "pt_f1310e",
          vitals: { bloodOxygen: 99, stress: 55, heartBeat: 122 },
          timestamp: "2026-04-08T13:10:30.000Z",
          deviceHealth: {
            deviceId: "wearable-10e",
            batteryLevel: 89,
            signalStrength: -55,
          },
        },
      ],
    },
  ],
};

const mockWearableInventory = [
  {
    wearableId: "wearable-k102",
    batteryLevel: 86,
    signalStrength: -60,
    activeReadsEnabled: true,
    lastReadAt: new Date(Date.now() - 3000).toISOString(),
  },
  {
    wearableId: "wearable-k233",
    batteryLevel: 8,
    signalStrength: -72,
    activeReadsEnabled: true,
    lastReadAt: new Date(Date.now() - 6000).toISOString(),
  },
  {
    wearableId: "wearable-k301",
    batteryLevel: 65,
    signalStrength: -68,
    activeReadsEnabled: false,
    lastReadAt: null,
  },
  {
    wearableId: "wearable-k417",
    batteryLevel: 42,
    signalStrength: -81,
    activeReadsEnabled: true,
    lastReadAt: new Date(Date.now() - 18000).toISOString(),
  },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const ACTIVE_READ_THRESHOLD_MS = 10000;
const LOW_BATTERY_THRESHOLD = 10;

const evaluateConnectionStatus = (meta) => {
  if (!meta?.deviceId) {
    return "unpaired";
  }

  if (!meta.activeReadsHealthy) {
    return "pending_reads";
  }

  const ageMs = meta.lastSyncTime
    ? Date.now() - new Date(meta.lastSyncTime).getTime()
    : Number.POSITIVE_INFINITY;

  return ageMs <= ACTIVE_READ_THRESHOLD_MS ? "connected" : "disconnected";
};

const withUiState = (record, previousHeartBeat = record.vitals.heartBeat) => {
  const signedBpmDelta = record.vitals.heartBeat - previousHeartBeat;
  const bpmDelta = Math.abs(signedBpmDelta);
  const isCritical = record.vitals.bloodOxygen < 90 || bpmDelta > 20;
  const heartBeatDirection =
    signedBpmDelta > 0 ? "rising" : signedBpmDelta < 0 ? "falling" : "steady";

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
      signedBpmDelta,
      heartBeatDirection,
    },
  };
};

const buildDeviceHealth = (patientId, baselineHealth = {}, pairedAt = null) => ({
  deviceId: baselineHealth.deviceId ?? `wearable-${patientId.slice(-4)}`,
  batteryLevel: clamp(baselineHealth.batteryLevel ?? 90, 25, 99),
  signalStrength: clamp(baselineHealth.signalStrength ?? -58, -95, -45),
  lastSyncTime: new Date().toISOString(),
  pairedAt,
  lowBatteryThreshold: LOW_BATTERY_THRESHOLD,
  activeReadsHealthy: true,
  connectionStatus: "connected",
});

const buildUnpairedTransportMeta = () => ({
  deviceId: null,
  batteryLevel: null,
  signalStrength: null,
  lastSyncTime: null,
  pairedAt: null,
  lowBatteryThreshold: LOW_BATTERY_THRESHOLD,
  activeReadsHealthy: false,
  connectionStatus: "unpaired",
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
      transportMeta: buildDeviceHealth(
        record.patientId,
        record.deviceHealth,
        record.timestamp,
      ),
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
  const signedBpmDelta = nextHeartBeat - previousVitals.heartBeat;
  const bpmDelta = Math.abs(signedBpmDelta);
  const isCritical = nextBloodOxygen < 90 || bpmDelta > 20;
  const heartBeatDirection =
    signedBpmDelta > 0 ? "rising" : signedBpmDelta < 0 ? "falling" : "steady";

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
      batteryLevel:
        typeof patient.transportMeta.batteryLevel === "number"
          ? clamp(patient.transportMeta.batteryLevel - Math.random() * 0.3, 1, 100)
          : patient.transportMeta.batteryLevel,
      signalStrength:
        typeof patient.transportMeta.signalStrength === "number"
          ? clamp(
              patient.transportMeta.signalStrength +
                (Math.random() > 0.5 ? 1 : -1),
              -96,
              -44,
            )
          : patient.transportMeta.signalStrength,
      lastSyncTime: timestamp,
      activeReadsHealthy: true,
      connectionStatus: "connected",
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
      signedBpmDelta,
      heartBeatDirection,
      monitoringStatus: "Live reads active",
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
    transportMeta: buildUnpairedTransportMeta(),
    uiState: {
      isCritical: false,
      criticalReason: "Stable",
      bpmDelta: 0,
      signedBpmDelta: 0,
      heartBeatDirection: "steady",
      monitoringStatus: "Pair wearable to begin active tracking",
    },
    accountMeta: {
      loginId: account.loginId,
      temporary: Boolean(account.temporary),
      status: account.status ?? "active",
    },
  };
};

export const listAvailableWearables = () =>
  mockWearableInventory.map((wearable) => ({ ...wearable }));

export const runWearablePrecheck = (wearableId) => {
  const wearable = mockWearableInventory.find(
    (candidate) => candidate.wearableId === wearableId,
  );

  if (!wearable) {
    return null;
  }

  const now = Date.now();
  const lastReadAt = wearable.lastReadAt;
  const lastReadAgeMs = lastReadAt
    ? Math.max(now - new Date(lastReadAt).getTime(), 0)
    : Number.POSITIVE_INFINITY;
  const hasActiveReads = wearable.activeReadsEnabled && lastReadAgeMs <= ACTIVE_READ_THRESHOLD_MS;
  const batteryCritical = wearable.batteryLevel < LOW_BATTERY_THRESHOLD;

  return {
    wearableId: wearable.wearableId,
    batteryLevel: wearable.batteryLevel,
    signalStrength: wearable.signalStrength,
    lastReadAt,
    hasActiveReads,
    batteryCritical,
    lowBatteryThreshold: LOW_BATTERY_THRESHOLD,
    connectionStatusLabel: hasActiveReads ? "Ready" : "Waiting for active reads",
  };
};

export const connectWearableToPatient = (patient, precheckResult) => {
  const timestamp = new Date().toISOString();

  const nextTransportMeta = {
    ...patient.transportMeta,
    deviceId: precheckResult.wearableId,
    batteryLevel: precheckResult.batteryLevel,
    signalStrength: precheckResult.signalStrength,
    lastSyncTime: precheckResult.lastReadAt ?? timestamp,
    pairedAt: timestamp,
    lowBatteryThreshold: precheckResult.lowBatteryThreshold,
    activeReadsHealthy: precheckResult.hasActiveReads,
    connectionStatus: precheckResult.hasActiveReads ? "connected" : "pending_reads",
  };

  return {
    ...patient,
    transportMeta: {
      ...nextTransportMeta,
      connectionStatus: evaluateConnectionStatus(nextTransportMeta),
    },
    uiState: {
      ...patient.uiState,
      monitoringStatus: precheckResult.hasActiveReads
        ? "Live reads active"
        : "No active reads yet",
      batteryCritical: precheckResult.batteryCritical,
    },
  };
};
