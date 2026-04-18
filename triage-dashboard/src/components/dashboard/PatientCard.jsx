function PatientCard({ patient, onSelect, onRelease }) {
  const { patientName, patientId, clinicalPayload, uiState } = patient;

  const trendLabel =
    uiState.heartBeatDirection === "rising"
      ? "Rising"
      : uiState.heartBeatDirection === "falling"
        ? "Falling"
        : "Stable";

  const trendArrow =
    uiState.heartBeatDirection === "rising"
      ? "↑"
      : uiState.heartBeatDirection === "falling"
        ? "↓"
        : "→";

  const velocityText = `${trendArrow} ${trendLabel} ${Math.abs(uiState.signedBpmDelta ?? 0)} bpm`;

  const connectionLabel =
    patient.transportMeta.connectionStatus === "connected"
      ? "Connected"
      : patient.transportMeta.connectionStatus === "pending_reads"
        ? "Pending reads"
        : patient.transportMeta.connectionStatus === "disconnected"
          ? "Disconnected"
          : "Unpaired";

  const handleRelease = (event) => {
    event.stopPropagation();
    onRelease(patientId);
  };

  const handleOpenDetails = () => {
    onSelect(patientId);
  };

  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpenDetails();
    }
  };

  return (
    <article
      className={`triage-row ${uiState.isCritical ? "triage-row--critical" : ""}`}
      aria-label={`Open details for ${patientName}`}
      role="button"
      tabIndex={0}
      onClick={handleOpenDetails}
      onKeyDown={handleCardKeyDown}
    >
      <div className="triage-row__cell triage-row__cell--identity">
        <h3>{patientName}</h3>
        <span className="triage-row__meta">{patientId}</span>
      </div>

      <div className="triage-row__cell triage-row__cell--vital">
        <span className="triage-row__label">SpO₂</span>
        <strong>{clinicalPayload.vitals.bloodOxygen}%</strong>
      </div>

      <div className="triage-row__cell triage-row__cell--vital">
        <span className="triage-row__label">BPM</span>
        <strong>{clinicalPayload.vitals.heartBeat}</strong>
      </div>

      <div className="triage-row__cell triage-row__cell--vital">
        <span className="triage-row__label">Stress</span>
        <strong>{clinicalPayload.vitals.stress}</strong>
      </div>

      <div className="triage-row__cell">
        <span
          className={`status-text status-text--trend-${uiState.heartBeatDirection}`}
          aria-label={`Heartbeat trend ${trendLabel}`}
        >
          {velocityText}
        </span>
      </div>

      <div className="triage-row__cell">
        <span
          className={`status-text status-text--connection-${connectionLabel
            .toLowerCase()
            .replace(/\s+/g, "-")}`}
        >
          {connectionLabel}
        </span>
      </div>

      {uiState.isCritical ? (
        <p className="triage-row__critical-message">{uiState.criticalReason}</p>
      ) : null}

      <div className="triage-row__actions">
        <button
          type="button"
          className="primary-action"
          onClick={(event) => {
            event.stopPropagation();
            handleOpenDetails();
          }}
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
