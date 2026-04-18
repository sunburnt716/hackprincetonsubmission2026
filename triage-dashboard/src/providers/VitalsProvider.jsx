import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildInitialQueueFromMockData,
  buildPatientFromRegisteredAccount,
  sortTriageQueue,
  tickPatientTelemetry,
  updateStaleness,
} from "../services/triageService.mock";
import CircularBuffer from "../utils/CircularBuffer";
import { VitalsContext } from "./vitalsContext";

const TREND_BUFFER_SIZE = 60;
const WAVEFORM_BUFFER_SIZE = 150;

const createTrendBuffers = () => ({
  bpm: new CircularBuffer(TREND_BUFFER_SIZE),
  spo2: new CircularBuffer(TREND_BUFFER_SIZE),
});

const waveformSample = (timeMs, heartBeat) => {
  const frequency = heartBeat / 60;
  const base = Math.sin((2 * Math.PI * frequency * timeMs) / 1000);
  const harmonic =
    0.35 * Math.sin((4 * Math.PI * frequency * timeMs) / 1000 + 0.8);
  const spike = Math.sin((10 * Math.PI * frequency * timeMs) / 1000) * 0.15;
  return base + harmonic + spike;
};

function VitalsProvider({ children }) {
  const [patients, setPatients] = useState(() =>
    sortTriageQueue(buildInitialQueueFromMockData()),
  );
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const trendBuffersRef = useRef(new Map());
  const waveformBuffersRef = useRef(new Map());

  const initBuffersForPatient = (patient) => {
    if (!trendBuffersRef.current.has(patient.patientId)) {
      const trend = createTrendBuffers();
      for (let index = 0; index < TREND_BUFFER_SIZE; index += 1) {
        trend.bpm.push(patient.clinicalPayload.vitals.heartBeat);
        trend.spo2.push(patient.clinicalPayload.vitals.bloodOxygen);
      }
      trendBuffersRef.current.set(patient.patientId, trend);
    }

    if (!waveformBuffersRef.current.has(patient.patientId)) {
      const wave = new CircularBuffer(WAVEFORM_BUFFER_SIZE);
      const now = Date.now();
      for (let index = 0; index < WAVEFORM_BUFFER_SIZE; index += 1) {
        wave.push(
          waveformSample(
            now + index * 40,
            patient.clinicalPayload.vitals.heartBeat,
          ),
        );
      }
      waveformBuffersRef.current.set(patient.patientId, wave);
    }
  };

  const purgePatientBuffers = (patientId) => {
    trendBuffersRef.current.get(patientId)?.bpm.clear();
    trendBuffersRef.current.get(patientId)?.spo2.clear();
    waveformBuffersRef.current.get(patientId)?.clear();

    trendBuffersRef.current.delete(patientId);
    waveformBuffersRef.current.delete(patientId);
  };

  useEffect(() => {
    patients.forEach(initBuffersForPatient);
  }, [patients]);

  useEffect(() => {
    const trendInterval = setInterval(() => {
      setPatients((current) => {
        if (!current.length) {
          return current;
        }

        const targetIndex = Math.floor(Math.random() * current.length);
        const next = current.map((patient, index) =>
          index === targetIndex
            ? tickPatientTelemetry(patient)
            : updateStaleness(patient, 10),
        );

        next.forEach((patient) => {
          const trend = trendBuffersRef.current.get(patient.patientId);
          if (trend) {
            trend.bpm.push(patient.clinicalPayload.vitals.heartBeat);
            trend.spo2.push(patient.clinicalPayload.vitals.bloodOxygen);
          }
        });

        return sortTriageQueue(next);
      });
    }, 1000);

    return () => clearInterval(trendInterval);
  }, []);

  useEffect(() => {
    const waveInterval = setInterval(() => {
      const now = Date.now();
      setPatients((current) => {
        current.forEach((patient) => {
          const wave = waveformBuffersRef.current.get(patient.patientId);
          if (wave) {
            wave.push(
              waveformSample(now, patient.clinicalPayload.vitals.heartBeat),
              now,
            );
          }
        });

        return current;
      });
    }, 40);

    return () => clearInterval(waveInterval);
  }, []);

  useEffect(
    () => () => {
      trendBuffersRef.current.forEach((buffers) => {
        buffers.bpm.clear();
        buffers.spo2.clear();
      });
      waveformBuffersRef.current.forEach((buffer) => buffer.clear());
      trendBuffersRef.current.clear();
      waveformBuffersRef.current.clear();
    },
    [],
  );

  const addPatientFromAccount = (account) => {
    const newPatient = buildPatientFromRegisteredAccount(account);
    initBuffersForPatient(newPatient);
    setPatients((current) => sortTriageQueue([newPatient, ...current]));
  };

  const releasePatient = (patientId) => {
    purgePatientBuffers(patientId);
    setPatients((current) =>
      current.filter((patient) => patient.patientId !== patientId),
    );
    setSelectedPatientId((current) => (current === patientId ? null : current));
  };

  const selectedPatient = useMemo(
    () =>
      patients.find((patient) => patient.patientId === selectedPatientId) ??
      null,
    [patients, selectedPatientId],
  );

  const criticalCount = useMemo(
    () => patients.filter((patient) => patient.uiState.isCritical).length,
    [patients],
  );

  const value = {
    patients,
    criticalCount,
    selectedPatient,
    selectedPatientId,
    setSelectedPatientId,
    addPatientFromAccount,
    releasePatient,
    getTrendSeries: (patientId) => {
      const bufferSet = trendBuffersRef.current.get(patientId);
      if (!bufferSet) {
        return { bpmSeries: [], spo2Series: [] };
      }

      return {
        bpmSeries: bufferSet.bpm.valuesWithTimestamps(),
        spo2Series: bufferSet.spo2.valuesWithTimestamps(),
      };
    },
    getWaveformSeries: (patientId) => {
      const buffer = waveformBuffersRef.current.get(patientId);
      return buffer ? buffer.valuesWithTimestamps() : [];
    },
  };

  return (
    <VitalsContext.Provider value={value}>{children}</VitalsContext.Provider>
  );
}

export default VitalsProvider;
