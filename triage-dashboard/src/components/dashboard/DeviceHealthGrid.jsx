function DeviceHealthGrid({ patients }) {
  return (
    <section className="device-health">
      <h2>Device Health</h2>
      <div className="device-health__grid">
        {patients.map((patient) => (
          <article key={patient.patientId} className="device-health__card">
            <h3>{patient.transportMeta.deviceId}</h3>
            <p>
              <strong>Patient:</strong> {patient.patientName}
            </p>
            <p>
              <strong>Battery:</strong>{" "}
              {Math.round(patient.transportMeta.batteryLevel)}%
            </p>
            <p>
              <strong>Signal:</strong>{" "}
              {Math.round(patient.transportMeta.signalStrength)} dBm
            </p>
            <p>
              <strong>Last Sync:</strong>{" "}
              {new Date(
                patient.transportMeta.lastSyncTime,
              ).toLocaleTimeString()}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DeviceHealthGrid;
