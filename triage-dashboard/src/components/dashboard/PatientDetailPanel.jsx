import LiveWaveformCanvas from "./charts/LiveWaveformCanvas";
import { useVitals } from "../../providers/useVitals";

function PatientDetailPanel({ patient, onClose, onRelease, inline = false }) {
  const { getWaveformSeries, getPipelineState } = useVitals();

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
  const pipelineState = getPipelineState(patient.patientId);
  const isStale = pipelineState?.status?.state === "stale";
  const hasActiveConnection =
    patient?.transportMeta?.connectionStatus === "connected" &&
    patient?.transportMeta?.activeReadsHealthy;
  const spo2 = patient?.clinicalPayload?.vitals?.bloodOxygen;
  const heartBeat = patient?.clinicalPayload?.vitals?.heartBeat;
  const stress = patient?.clinicalPayload?.vitals?.stress;

  return (
    <aside
      className={`detail-panel ${inline ? "detail-panel--inline" : ""}`.trim()}
      aria-label="Patient detail panel"
    >
      <header className="detail-panel__header">
        <div>
          <h2>Patient Detail</h2>
          <span className="detail-panel__id">{patient.patientId}</span>
        </div>
        {onClose ? (
          <button
            type="button"
            className="detail-panel__close"
            onClick={onClose}
          >
            Close
          </button>
        ) : null}
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
            <span>
              {typeof heartBeat === "number" ? `${heartBeat} bpm` : "--"}
            </span>
          </p>
          <p>
            <strong>SpO₂</strong>
            <span>{typeof spo2 === "number" ? `${spo2}%` : "--"}</span>
          </p>
          <p>
            <strong>Stress</strong>
            <span>{typeof stress === "number" ? stress : "--"}</span>
          </p>
          <p>
            <strong>Monitoring</strong>
            <span>{patient.uiState.monitoringStatus ?? "Awaiting update"}</span>
          </p>
        </div>

        {hasActiveConnection ? (
          <>
            <LiveWaveformCanvas samples={waveformSamples} isStale={isStale} />

            {isStale ? (
              <p className="inline-note">
                Waveform is stale. Check connection before relying on live
                updates.
              </p>
            ) : null}
          </>
        ) : (
          <p className="inline-note">
            No active wearable connection for this patient. Live visualization
            is hidden until a device is connected and sending reads.
          </p>
        )}

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
