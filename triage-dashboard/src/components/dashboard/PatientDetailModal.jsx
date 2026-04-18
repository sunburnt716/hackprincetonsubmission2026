import LiveWaveformCanvas from "./charts/LiveWaveformCanvas";
import { useVitals } from "../../providers/useVitals";

function PatientDetailModal({ patient, onClose, onRelease }) {
  const { getWaveformSeries } = useVitals();

  if (!patient) {
    return null;
  }

  const waveformSamples = getWaveformSeries(patient.patientId);
  const latestTimestamp = new Date(patient.clinicalPayload.timestamp).getTime();

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="dashboard-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dashboard-modal__header">
          <h2 id="patient-detail-title">Patient Detail</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="dashboard-modal__content">
          <p>
            <strong>Name:</strong> {patient.patientName}
          </p>
          <p>
            <strong>Patient ID:</strong> {patient.patientId}
          </p>
          <p>
            <strong>Linked Account:</strong> {patient.patientEmail}
          </p>
          <p>
            <strong>Heart Rate:</strong>{" "}
            {patient.clinicalPayload.vitals.heartBeat} bpm
          </p>
          <p>
            <strong>Blood Oxygen:</strong>{" "}
            {patient.clinicalPayload.vitals.bloodOxygen}%
          </p>
          <p>
            <strong>Stress:</strong> {patient.clinicalPayload.vitals.stress}
          </p>
          <p>
            <strong>Signal:</strong>{" "}
            {Math.round(patient.transportMeta.signalStrength)} dBm
          </p>
          <p>
            <strong>Battery:</strong>{" "}
            {Math.round(patient.transportMeta.batteryLevel)}%
          </p>
          <p>
            <strong>Last Sync:</strong>{" "}
            {new Date(patient.transportMeta.lastSyncTime).toLocaleTimeString()}
          </p>

          <LiveWaveformCanvas
            samples={waveformSamples}
            latestTimestamp={latestTimestamp}
          />

          <button
            type="button"
            className="secondary-action"
            onClick={() => {
              onRelease(patient.patientId);
              onClose();
            }}
          >
            Release Patient
          </button>
        </div>
      </section>
    </div>
  );
}

export default PatientDetailModal;
