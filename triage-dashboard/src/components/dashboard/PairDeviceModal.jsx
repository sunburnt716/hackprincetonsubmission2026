import { useEffect, useState } from "react";

function PairDeviceModal({
  isOpen,
  patient,
  wearables,
  onClose,
  onRunChecks,
  onConnect,
}) {
  const [selectedWearableId, setSelectedWearableId] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedWearableId(wearables[0]?.wearableId ?? "");
    setCheckResult(null);
    setError("");
  }, [isOpen, wearables]);

  if (!isOpen || !patient) {
    return null;
  }

  const handleRunChecks = () => {
    setError("");

    if (!selectedWearableId) {
      setError("Please choose a wearable before running checks.");
      return;
    }

    const result = onRunChecks(selectedWearableId);
    if (!result) {
      setError("Unable to run checks right now. Please try again.");
      return;
    }

    setCheckResult(result);
  };

  const handleConnect = () => {
    setError("");

    if (!checkResult) {
      setError("Run checks before connecting a wearable.");
      return;
    }

    if (!checkResult.hasActiveReads) {
      setError("Active reads are required before tracking can begin.");
      return;
    }

    onConnect(checkResult);
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="dashboard-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pair-device-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dashboard-modal__header">
          <h2 id="pair-device-title">Connect Wearable</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="dashboard-modal__content">
          <p>
            <strong>Patient:</strong> {patient.patientName}
          </p>
          <p className="inline-note">
            Select a wearable, run safety checks, then begin tracking.
          </p>

          <label htmlFor="wearable-select">Wearable Device</label>
          <select
            id="wearable-select"
            className="dashboard-modal__select"
            value={selectedWearableId}
            onChange={(event) => setSelectedWearableId(event.target.value)}
          >
            {wearables.map((wearable) => (
              <option key={wearable.wearableId} value={wearable.wearableId}>
                {wearable.wearableId} · Battery {wearable.batteryLevel}%
              </option>
            ))}
          </select>

          <button
            type="button"
            className="secondary-action"
            onClick={handleRunChecks}
          >
            Run Device Checks
          </button>

          {checkResult ? (
            <div className="pairing-checks">
              <p>
                <strong>Active Reads:</strong>{" "}
                {checkResult.hasActiveReads ? "Ready" : "Not Ready"}
              </p>
              <p>
                <strong>Battery:</strong> {checkResult.batteryLevel}%
              </p>
              <p>
                <strong>Status:</strong> {checkResult.connectionStatusLabel}
              </p>
              <p>
                <strong>Last Read:</strong>{" "}
                {checkResult.lastReadAt
                  ? new Date(checkResult.lastReadAt).toLocaleTimeString()
                  : "No reads yet"}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            className="primary-action"
            onClick={handleConnect}
          >
            Connect and Begin Tracking
          </button>

          {error ? <p className="auth-error">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}

export default PairDeviceModal;
