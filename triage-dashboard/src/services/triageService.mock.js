import { sortTriageQueue } from "./triageService";

const clonePatient = (patient) => ({
  ...patient,
  clinicalPayload: {
    ...patient.clinicalPayload,
    vitals: {
      ...patient.clinicalPayload.vitals,
    },
  },
  uiState: {
    ...patient.uiState,
    criticalMoments: [...(patient.uiState?.criticalMoments ?? [])],
  },
  transportMeta: patient.transportMeta
    ? { ...patient.transportMeta }
    : undefined,
});

const MOCK_TRIAGE_PATIENTS = [
  {
    patientName: "Rina Patel",
    patientId: "pt_7ca901",
    clinicalPayload: {
      timestamp: "2026-04-08T09:11:00.000Z",
      vitals: {
        bloodOxygen: 87,
        stress: 72,
        heartBeat: 118,
      },
    },
    uiState: {
      isCritical: true,
      criticalReason: "Hypoxia trend",
      bpmDelta: 14,
      signedBpmDelta: 14,
      heartBeatDirection: "rising",
      stale: false,
      criticalMoments: ["SpO₂ dropped below 90%"],
    },
    transportMeta: {
      connectionStatus: "connected",
    },
  },
  {
    patientName: "Elias Romero",
    patientId: "pt_23de11",
    clinicalPayload: {
      timestamp: "2026-04-08T10:15:00.000Z",
      vitals: {
        bloodOxygen: 92,
        stress: 88,
        heartBeat: 132,
      },
    },
    uiState: {
      isCritical: true,
      criticalReason: "Trauma response",
      bpmDelta: 21,
      signedBpmDelta: 21,
      heartBeatDirection: "rising",
      stale: false,
      criticalMoments: ["Sympathetic surge noted"],
    },
    transportMeta: {
      connectionStatus: "pending_reads",
    },
  },
  {
    patientName: "Jordan Miles",
    patientId: "pt_8f3b21",
    clinicalPayload: {
      timestamp: "2026-04-08T08:01:00.000Z",
      vitals: {
        bloodOxygen: 98,
        stress: 35,
        heartBeat: 75,
      },
    },
    uiState: {
      isCritical: false,
      bpmDelta: -1,
      signedBpmDelta: -1,
      heartBeatDirection: "falling",
      stale: false,
      criticalMoments: [],
    },
    transportMeta: {
      connectionStatus: "connected",
    },
  },
  {
    patientName: "Amina Okafor",
    patientId: "pt_4d91aa",
    clinicalPayload: {
      timestamp: "2026-04-08T11:06:00.000Z",
      vitals: {
        bloodOxygen: 95,
        stress: 48,
        heartBeat: 89,
      },
    },
    uiState: {
      isCritical: false,
      bpmDelta: 6,
      signedBpmDelta: 6,
      heartBeatDirection: "rising",
      stale: false,
      criticalMoments: [],
    },
    transportMeta: {
      connectionStatus: "disconnected",
    },
  },
  {
    patientName: "Marcus Lee",
    patientId: "pt_51f2cc",
    clinicalPayload: {
      timestamp: "2026-04-08T11:18:00.000Z",
      vitals: {
        bloodOxygen: 97,
        stress: 31,
        heartBeat: 67,
      },
    },
    uiState: {
      isCritical: false,
      bpmDelta: 0,
      signedBpmDelta: 0,
      heartBeatDirection: "steady",
      stale: false,
      criticalMoments: [],
    },
  },
];

export const buildInitialQueueFromMockData = () =>
  sortTriageQueue(MOCK_TRIAGE_PATIENTS.map(clonePatient));

export { sortTriageQueue };
