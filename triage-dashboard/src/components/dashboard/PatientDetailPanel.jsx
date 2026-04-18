import LiveWaveformCanvas from "./charts/LiveWaveformCanvas";
import { useVitals } from "../../providers/useVitals";

function PatientDetailPanel({ patient, onRelease }) {
  const { getWaveformSeries } = useVitals();

  if (!patient) {
    return (
      <aside className="detail-panel">
        <h2>Patient Detail</h2>
        <p className="inline-note">
          Select a patient from the triage queue to view details.
        </p>
      </aside>
    );
  }

  const waveformSamples = getWaveformSeries(patient.patientId);

  return (
    <aside className="detail-panel" aria-label="Patient detail panel">
      <header className="detail-panel__header">
        <h2>Patient Detail</h2>
        <span className="detail-panel__id">{patient.patientId}</span>
      </header>

      <div className="detail-panel__content">
        <div className="detail-panel__grid">
          <p>
            <strong>Name</strong>
            <span>{patient.patientName}</span>
          </p>
          <p>
            <strong>Account</strong>
            <span>{patient.patientEmail}</span>
          </p>
          <p>
            <strong>Heart Rate</strong>
            <span>{patient.clinicalPayload.vitals.heartBeat} bpm</span>
          </p>
          <p>
            <strong>SpO₂</strong>
            <span>{patient.clinicalPayload.vitals.bloodOxygen}%</span>
          </p>
          <p>
            <strong>Stress</strong>
            <span>{patient.clinicalPayload.vitals.stress}</span>
          </p>
          <p>
            <strong>Monitoring</strong>
            <span>{patient.uiState.monitoringStatus ?? "Awaiting update"}</span>
          </p>
        </div>

        <LiveWaveformCanvas samples={waveformSamples} />

        <button
          type="button"
          className="secondary-action"
          onClick={() => onRelease(patient.patientId)}
        >
          Release Patient
        </button>
      </div>
    </aside>
  );
}

export default PatientDetailPanel;
