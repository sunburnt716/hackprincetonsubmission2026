import { useEffect, useMemo, useRef, useState } from "react";
import AddPatientModal from "../components/dashboard/AddPatientModal";
import DeviceHealthGrid from "../components/dashboard/DeviceHealthGrid";
import PatientCard from "../components/dashboard/PatientCard";
import PatientDetailModal from "../components/dashboard/PatientDetailModal";
import { useVitals } from "../providers/useVitals";
import { getCurrentSession } from "../services/authService.mock";
import VitalsProvider from "../providers/VitalsProvider";
import "./Dashboard.css";

function playAlertTone() {
  const audioContext = new window.AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
  gain.gain.setValueAtTime(0.04, audioContext.currentTime);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
}

function DashboardContent() {
  const session = useMemo(
    () =>
      getCurrentSession() ?? {
        accountType: "staff",
        loginId: "staff:guest@kinovo.local",
        email: "guest@kinovo.local",
        fullName: "Guest Staff",
      },
    [],
  );
  const {
    patients,
    criticalCount,
    selectedPatient,
    setSelectedPatientId,
    addPatientFromAccount,
    releasePatient,
  } = useVitals();
  const [showDeviceHealth, setShowDeviceHealth] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const previousCriticalCountRef = useRef(0);

  useEffect(() => {
    const previousCriticalCount = previousCriticalCountRef.current;
    if (soundEnabled && criticalCount > previousCriticalCount) {
      playAlertTone();
    }

    previousCriticalCountRef.current = criticalCount;
  }, [criticalCount, soundEnabled]);

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h1>Kinovo Waiting Room</h1>
          <p>
            Signed in as <strong>{session.fullName || session.email}</strong> (
            {session.accountType})
          </p>
        </div>

        <p className="status-pill">
          System Status: {criticalCount > 0 ? "Critical Alerts" : "Monitoring"}
        </p>
      </header>

      <section className="dashboard-controls">
        <button
          type="button"
          className="primary-action"
          onClick={() => setIsAddPatientOpen(true)}
        >
          Add Patient
        </button>

        <label className="toggle-control" htmlFor="toggle-device-health">
          <input
            id="toggle-device-health"
            type="checkbox"
            checked={showDeviceHealth}
            onChange={(event) => setShowDeviceHealth(event.target.checked)}
          />
          Show Device Health
        </label>

        <label className="toggle-control" htmlFor="toggle-sound-alerts">
          <input
            id="toggle-sound-alerts"
            type="checkbox"
            checked={soundEnabled}
            onChange={(event) => setSoundEnabled(event.target.checked)}
          />
          Enable Alert Sound
        </label>
      </section>

      <section className="waiting-room-section">
        <h2>Waiting Room</h2>
        <div className="waiting-room-scroll">
          <div className="waiting-room-grid">
            {patients.map((patient) => (
              <PatientCard
                key={patient.patientId}
                patient={patient}
                onSelect={setSelectedPatientId}
                onRelease={releasePatient}
              />
            ))}
          </div>
        </div>
      </section>

      {showDeviceHealth ? <DeviceHealthGrid patients={patients} /> : null}

      <PatientDetailModal
        patient={selectedPatient}
        onClose={() => setSelectedPatientId(null)}
        onRelease={releasePatient}
      />
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onAddPatient={addPatientFromAccount}
        currentSession={session}
      />
    </main>
  );
}

function Dashboard() {
  return (
    <VitalsProvider>
      <DashboardContent />
    </VitalsProvider>
  );
}

export default Dashboard;
