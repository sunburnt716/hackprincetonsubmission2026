import LiveWaveformCanvas from "./charts/LiveWaveformCanvas";
import { useVitals } from "../../providers/useVitals";

function PatientDetailModal({ patient, onClose, onRelease }) {
  const { getWaveformSeries } = useVitals();

  if (!patient) {
    return null;
  }

  const waveformSamples = getWaveformSeries(patient.patientId);

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

          <LiveWaveformCanvas samples={waveformSamples} />

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
