const SYNC_STATE_LABELS = {
  live: "Live",
  stale: "Stale",
  offline: "Offline",
  backfilling: "Backfilling",
  degraded: "Degraded",
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) {
    return "No sync yet";
  }

  const ageMs = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) {
    return "No sync yet";
  }

  const ageSeconds = Math.floor(ageMs / 1000);
  if (ageSeconds < 60) {
    return `${ageSeconds}s ago`;
  }

  const ageMinutes = Math.floor(ageSeconds / 60);
  if (ageMinutes < 60) {
    return `${ageMinutes}m ago`;
  }

  const ageHours = Math.floor(ageMinutes / 60);
  return `${ageHours}h ago`;
};

function PortalTrustStrip({ reliabilityRail, onLogout }) {
  const syncState = reliabilityRail.syncState ?? "offline";
  const syncLabel = SYNC_STATE_LABELS[syncState] ?? "Offline";

  return (
    <header className="portal-trust-strip" aria-label="System trust indicators">
      <div className="portal-trust-strip__items">
        <p className={`trust-pill trust-pill--${syncState}`}>
          Sync: <strong>{syncLabel}</strong>
        </p>
        <p className="trust-pill">
          Unsynced: <strong>{reliabilityRail.unsyncedCount}</strong>
        </p>
        <p className="trust-pill">
          Last Sync:{" "}
          <strong>
            {formatRelativeTime(reliabilityRail.lastSuccessfulSyncAt)}
          </strong>
        </p>
        <p className="trust-pill">
          Stale Patients: <strong>{reliabilityRail.stalePatientCount}</strong>
        </p>
      </div>

      <button type="button" className="secondary-action" onClick={onLogout}>
        Log-out
      </button>
    </header>
  );
}

export default PortalTrustStrip;
