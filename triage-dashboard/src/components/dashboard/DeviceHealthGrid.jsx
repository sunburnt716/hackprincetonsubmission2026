function DeviceHealthGrid({ devices = [], compact = false }) {
  const labelForConnectionStatus = (status) => {
    if (status === "connected") {
      return "Connected";
    }
    if (status === "pending_reads") {
      return "Pending Reads";
    }
    if (status === "disconnected") {
      return "Disconnected";
    }
    return "Unpaired";
  };

  return (
    <section
      className={`device-health ${compact ? "device-health--panel" : ""}`.trim()}
    >
      <h2>Device Health</h2>
      <div className="device-health__table">
        {devices.map((device) => {
          const batteryLevel =
            typeof device.battery_level === "number"
              ? Math.round(device.battery_level)
              : null;
          const connectionStatus = labelForConnectionStatus(
            device.connection_status,
          );

          return (
            <article key={device.device_id} className="device-health__row">
              <span className="device-health__patient">
                {device.patient_name ?? "Unassigned"}
              </span>
              <span>{device.device_id ?? "Unknown device"}</span>
              <span>
                {typeof batteryLevel === "number" ? `${batteryLevel}%` : "N/A"}
                {typeof batteryLevel === "number" && batteryLevel < 10 ? (
                  <strong className="status-text status-text--connection-disconnected">
                    {" "}
                    Critical
                  </strong>
                ) : null}
              </span>
              <span
                className={`status-text status-text--connection-${connectionStatus
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {connectionStatus}
              </span>
              <span>
                {device.last_sync_time
                  ? new Date(device.last_sync_time).toLocaleTimeString()
                  : "No sync yet"}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default DeviceHealthGrid;
