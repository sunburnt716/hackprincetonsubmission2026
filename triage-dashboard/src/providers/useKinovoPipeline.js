import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  addPatientFromIntake,
  connectWearableToPatient,
  getAvailableWearables,
  getQueue,
  releasePatientFromWaitingRoom,
  runWearablePrecheck,
  sortTriageQueue,
} from "../services/triageService";
import {
  createPipelineState,
  createPipelineViewModel,
  ingestTrackAWaveform,
  ingestTrackBVitals,
  projectWaveformSeries,
  seedPipelineFromHistory,
} from "./kinovoPipeline.model";

const clonePatient = (patient) => ({
  ...patient,
  uiState: {
    ...patient.uiState,
    criticalMoments: [...(patient.uiState?.criticalMoments ?? [])],
    stale: Boolean(patient.uiState?.stale),
  },
});

const normalizePatients = (patients) =>
  sortTriageQueue(patients.map(clonePatient));

const getLatestVitals = (patient) => patient.clinicalPayload?.vitals ?? null;

const seedPipelineForPatient = (patient, now = Date.now()) => {
  const latestVitals = getLatestVitals(patient);
  const pipelineState = createPipelineState(latestVitals, now);

  pipelineState.criticalMoments = [...(patient.uiState?.criticalMoments ?? [])];
  pipelineState.pendingCriticalMoments = [];
  pipelineState.wasCritical = Boolean(patient.uiState?.isCritical);

  const history = patient.clinicalPayload?.history ?? [];
  if (history.length > 0) {
    seedPipelineFromHistory(
      pipelineState.trackA,
      pipelineState.trackB,
      history,
    );
  } else if (latestVitals) {
    ingestTrackAWaveform(pipelineState.trackA, latestVitals.heartBeat, now);
    ingestTrackBVitals(pipelineState.trackB, latestVitals, now);
  }

  return pipelineState;
};

function useKinovoPipeline() {
  const [patients, setPatients] = useState([]);
  const [availableWearables, setAvailableWearables] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const pipelineStateRef = useRef(new Map());
  const patientsRef = useRef(patients);

  useEffect(() => {
    patientsRef.current = patients;
  }, [patients]);

  const ensurePipeline = useCallback((patient) => {
    const existing = pipelineStateRef.current.get(patient.patientId);
    if (existing) {
      return existing;
    }

    const pipelineState = seedPipelineForPatient(patient);
    pipelineStateRef.current.set(patient.patientId, pipelineState);
    return pipelineState;
  }, []);

  const hydrateDashboard = useCallback(async () => {
    const [snapshot, wearables] = await Promise.all([
      getQueue(),
      getAvailableWearables(),
    ]);

    const nextPatients = normalizePatients(snapshot?.patients ?? []);
    setPatients(nextPatients);
    setAvailableWearables(wearables ?? []);

    return nextPatients;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const nextPatients = await hydrateDashboard();
        if (cancelled) {
          return;
        }

        nextPatients.forEach((patient) => ensurePipeline(patient));
      } catch {
        if (!cancelled) {
          setPatients([]);
          setAvailableWearables([]);
        }
      }
    };

    hydrate();

    const intervalId = setInterval(() => {
      hydrate();
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [ensurePipeline, hydrateDashboard]);

  useEffect(() => {
    patients.forEach((patient) => {
      const pipelineState = ensurePipeline(patient);
      const latestVitals = getLatestVitals(patient);

      if (!latestVitals?.heartBeat || !latestVitals?.bloodOxygen) {
        return;
      }

      const sampleTimestamp = patient.clinicalPayload?.timestamp
        ? new Date(patient.clinicalPayload.timestamp).getTime()
        : Date.now();

      ingestTrackAWaveform(
        pipelineState.trackA,
        latestVitals.heartBeat,
        sampleTimestamp,
      );
      ingestTrackBVitals(pipelineState.trackB, latestVitals, sampleTimestamp);
    });
  }, [ensurePipeline, patients]);

  const addPatient = useCallback(
    async (account) => {
      const payload = await addPatientFromIntake({
        fullName: account.fullName,
        email: account.email,
        temporary: Boolean(account.temporary),
        createdByLoginId: account.createdByLoginId,
      });

      const newPatient = clonePatient(payload?.patient);
      ensurePipeline(newPatient);
      setPatients((currentPatients) =>
        sortTriageQueue([newPatient, ...currentPatients]),
      );
      await hydrateDashboard();
      return newPatient;
    },
    [ensurePipeline, hydrateDashboard],
  );

  const runConnectionChecks = useCallback(async (patientId, wearableId) => {
    const patientExists = patientsRef.current.some(
      (patient) => patient.patientId === patientId,
    );
    if (!patientExists) {
      return null;
    }

    return runWearablePrecheck({ patientId, deviceId: wearableId });
  }, []);

  const connectPatientWearable = useCallback(
    async (patientId, precheckResult) => {
      if (!precheckResult?.wearableId) {
        return false;
      }

      await connectWearableToPatient({
        patientId,
        deviceId: precheckResult.wearableId,
      });
      await hydrateDashboard();
      return true;
    },
    [hydrateDashboard],
  );

  const releasePatient = useCallback(
    async (patientId) => {
      await releasePatientFromWaitingRoom({ patientId });
      await hydrateDashboard();
    },
    [hydrateDashboard],
  );

  const getTrendSeries = useCallback((patientId) => {
    const pipelineState = pipelineStateRef.current.get(patientId);
    if (!pipelineState) {
      return { bpmSeries: [], spo2Series: [], stressSeries: [] };
    }

    return {
      bpmSeries: pipelineState.trackB.bpm.valuesWithTimestamps(),
      spo2Series: pipelineState.trackB.spo2.valuesWithTimestamps(),
      stressSeries: pipelineState.trackB.stress.valuesWithTimestamps(),
    };
  }, []);

  const getWaveformSeries = useCallback((patientId) => {
    const pipelineState = pipelineStateRef.current.get(patientId);
    if (!pipelineState) {
      return [];
    }

    return projectWaveformSeries(pipelineState.trackA);
  }, []);

  const getPipelineState = useCallback((patientId) => {
    const pipelineState = pipelineStateRef.current.get(patientId);
    if (!pipelineState) {
      return null;
    }

    return {
      ...createPipelineViewModel(
        patientsRef.current.find(
          (patient) => patient.patientId === patientId,
        ) ?? null,
        pipelineState.trackA,
        pipelineState.trackB,
        Date.now(),
      ),
      criticalMoments: [...pipelineState.criticalMoments],
    };
  }, []);

  const getTrendMeta = useCallback((patientId) => {
    const pipelineState = pipelineStateRef.current.get(patientId);
    if (!pipelineState) {
      return null;
    }

    return pipelineState.trackB.meta;
  }, []);

  const activePatients = useMemo(
    () => patients.filter((patient) => !patient.uiState?.isDischarged),
    [patients],
  );
  const selectedPatient = useMemo(
    () =>
      patients.find((patient) => patient.patientId === selectedPatientId) ??
      null,
    [patients, selectedPatientId],
  );
  const criticalCount = useMemo(
    () => patients.filter((patient) => patient.uiState?.isCritical).length,
    [patients],
  );

  return {
    patients: activePatients,
    criticalCount,
    selectedPatient,
    selectedPatientId,
    setSelectedPatientId,
    addPatient,
    addPatientFromAccount: addPatient,
    runConnectionChecks,
    connectPatientWearable,
    releasePatient,
    getTrendSeries,
    getWaveformSeries,
    getPipelineState,
    getTrendMeta,
    listAvailableWearables: () => availableWearables,
  };
}

export default useKinovoPipeline;
