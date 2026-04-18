function DeviceHealthGrid({ patients, compact = false }) {
  const connectionStatus = (transportMeta) => {
    if (!transportMeta.deviceId) {
      return "Unpaired";
    }

    if (!transportMeta.activeReadsHealthy) {
      return "Pending Active Reads";
    }

    const ageMs = transportMeta.lastSyncTime
      ? Date.now() - new Date(transportMeta.lastSyncTime).getTime()
      : Number.POSITIVE_INFINITY;
    return ageMs <= 10000 ? "Connected" : "Disconnected";
  };

  return (
    <section
      className={`device-health ${compact ? "device-health--panel" : ""}`.trim()}
    >
      <h2>Device Health</h2>
      <div className="device-health__table">
        {patients.map((patient) => (
          <article key={patient.patientId} className="device-health__row">
            <span className="device-health__patient">
              {patient.patientName}
            </span>
            <span>{patient.transportMeta.deviceId ?? "Not assigned"}</span>
            <span>
              {typeof patient.transportMeta.batteryLevel === "number"
                ? `${Math.round(patient.transportMeta.batteryLevel)}%`
                : "N/A"}
              {typeof patient.transportMeta.batteryLevel === "number" &&
              patient.transportMeta.batteryLevel < 10 ? (
                <strong className="status-text status-text--connection-disconnected">
                  {" "}
                  Critical
                </strong>
              ) : null}
            </span>
            <span
              className={`status-text status-text--connection-${connectionStatus(
                patient.transportMeta,
              )
                .toLowerCase()
                .replace(/\s+/g, "-")}`}
            >
              {connectionStatus(patient.transportMeta)}
            </span>
            <span>
              {patient.transportMeta.pairedAt
                ? new Date(patient.transportMeta.pairedAt).toLocaleTimeString()
                : "Not paired yet"}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DeviceHealthGrid;
