import { useEffect, useMemo, useRef, useState } from "react";
import AddPatientModal from "../components/dashboard/AddPatientModal";
import PairDeviceModal from "../components/dashboard/PairDeviceModal";
import PatientCard from "../components/dashboard/PatientCard";
import PatientDetailPanel from "../components/dashboard/PatientDetailPanel";
import { useVitals } from "../providers/useVitals";
import { getCurrentSession } from "../services/authService";
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
    listAvailableWearables,
    runConnectionChecks,
    connectPatientWearable,
    releasePatient,
  } = useVitals();

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [pairingPatientId, setPairingPatientId] = useState(null);
  const [workflowAlert, setWorkflowAlert] = useState(null);
  const previousCriticalCountRef = useRef(0);

  const pairingPatient = useMemo(
    () =>
      patients.find((patient) => patient.patientId === pairingPatientId) ??
      null,
    [patients, pairingPatientId],
  );

  const availableWearables = useMemo(
    () => listAvailableWearables(),
    [listAvailableWearables],
  );

  useEffect(() => {
    const previousCriticalCount = previousCriticalCountRef.current;
    if (soundEnabled && criticalCount > previousCriticalCount) {
      playAlertTone();
    }

    previousCriticalCountRef.current = criticalCount;
  }, [criticalCount, soundEnabled]);

  const handleAddPatient = async (account) => {
    const newPatient = await addPatientFromAccount(account);
    if (newPatient) {
      setIsAddPatientOpen(false);
      setPairingPatientId(newPatient.patientId);
    }
  };

  const handleRunConnectionChecks = async (wearableId) => {
    if (!pairingPatientId) {
      return null;
    }

    const result = await runConnectionChecks(pairingPatientId, wearableId);
    if (!result) {
      return null;
    }

    if (!result.hasActiveReads) {
      setWorkflowAlert({
        level: "warning",
        title: "Device data delayed",
        message:
          "No active readings received yet. Check wristband placement and confirm the wearable is actively reading.",
      });
    }

    if (result.batteryCritical) {
      setWorkflowAlert({
        level: "critical",
        title: "Device battery low",
        message:
          "Battery is below 10%. Please switch or charge this wearable before beginning monitoring.",
      });
    }

    return result;
  };

  const handleConnectWearable = async (precheckResult) => {
    if (!pairingPatientId) {
      return;
    }

    const connected = await connectPatientWearable(
      pairingPatientId,
      precheckResult,
    );
    if (!connected) {
      return;
    }

    setPairingPatientId(null);
  };

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h1>Kinova Waiting Room</h1>
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

      <div className="dashboard-main">
        <section className="waiting-room-section">
          <h2>Waiting Room</h2>

          <div className="triage-header" aria-hidden="true">
            <span>Patient</span>
            <span>SpO₂</span>
            <span>BPM</span>
            <span>Stress</span>
            <span>Acuity Velocity</span>
            <span>Device Status</span>
            <span>Actions</span>
          </div>

          <div className="waiting-room-scroll">
            <div className="waiting-room-grid">
              {patients.map((patient) => (
                <div key={patient.patientId} className="waiting-room-item">
                  <PatientCard
                    patient={patient}
                    isSelected={
                      selectedPatient?.patientId === patient.patientId
                    }
                    onSelect={setSelectedPatientId}
                    onRelease={releasePatient}
                  />

                  {selectedPatient?.patientId === patient.patientId ? (
                    <PatientDetailPanel
                      patient={selectedPatient}
                      inline
                      onClose={() => setSelectedPatientId(null)}
                      onRelease={releasePatient}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onAddPatient={handleAddPatient}
        currentSession={session}
      />

      <PairDeviceModal
        isOpen={Boolean(pairingPatient)}
        patient={pairingPatient}
        wearables={availableWearables}
        onClose={() => setPairingPatientId(null)}
        onRunChecks={handleRunConnectionChecks}
        onConnect={handleConnectWearable}
      />

      {workflowAlert ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setWorkflowAlert(null)}
        >
          <section
            className={`dashboard-modal dashboard-modal--alert dashboard-modal--alert-${workflowAlert.level}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="workflow-alert-title"
          >
            <header className="dashboard-modal__header">
              <h2 id="workflow-alert-title">{workflowAlert.title}</h2>
              <button type="button" onClick={() => setWorkflowAlert(null)}>
                Close
              </button>
            </header>

            <div className="dashboard-modal__content">
              <p>{workflowAlert.message}</p>
              <button
                type="button"
                className="primary-action"
                onClick={() => setWorkflowAlert(null)}
              >
                Acknowledge
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Dashboard() {
  return <DashboardContent />;
}

export default Dashboard;
