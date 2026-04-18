import DeviceHealthGrid from "../components/dashboard/DeviceHealthGrid";
import { useVitals } from "../providers/useVitals";

function DeviceHealthPage() {
  const { patients } = useVitals();

  return (
    <main className="portal-page-shell" aria-live="polite">
      <section className="portal-page-panel">
        <h1>Device Health</h1>
        <p className="portal-page-note">
          Fleet status for all currently monitored waiting-room patients.
        </p>
        <DeviceHealthGrid patients={patients} />
      </section>
    </main>
  );
}

export default DeviceHealthPage;
