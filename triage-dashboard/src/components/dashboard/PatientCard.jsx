import AcuitySparkline from "./charts/AcuitySparkline";
import { useVitals } from "../../providers/useVitals";

function PatientCard({ patient, onSelect, onRelease }) {
  const { patientName, patientId, clinicalPayload, transportMeta, uiState } =
    patient;
  const { getTrendSeries } = useVitals();
  const { bpmSeries, spo2Series } = getTrendSeries(patientId);

  const handleRelease = (event) => {
    event.stopPropagation();
    onRelease(patientId);
  };

  return (
    <article
      className={`patient-card ${uiState.isCritical ? "critical" : ""} ${uiState.isStale ? "stale" : ""}`}
      aria-label={`Open details for ${patientName}`}
    >
      <div className="patient-card__header">
        <h3>{patientName}</h3>
        <span>{patientId}</span>
      </div>

      <div className="patient-card__vitals">
        <p>
          <strong>BPM:</strong> {clinicalPayload.vitals.heartBeat}
        </p>
        <p>
          <strong>SpO₂:</strong> {clinicalPayload.vitals.bloodOxygen}%
        </p>
        <p>
          <strong>Stress:</strong> {clinicalPayload.vitals.stress}
        </p>
      </div>

      <AcuitySparkline
        bpmSeries={bpmSeries}
        spo2Series={spo2Series}
        latestTimestamp={new Date(clinicalPayload.timestamp).getTime()}
      />

      <div className="patient-card__meta">
        <span>Updated {uiState.lastUpdatedSeconds}s ago</span>
        <span>Device {transportMeta.deviceId}</span>
      </div>

      {uiState.isCritical ? (
        <p className="patient-card__critical-message">
          Critical alert: {uiState.criticalReason}
        </p>
      ) : null}

      <div className="patient-card__actions">
        <button
          type="button"
          className="primary-action"
          onClick={() => onSelect(patientId)}
        >
          View Details
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={handleRelease}
        >
          Release Patient
        </button>
      </div>
    </article>
  );
}

export default PatientCard;
