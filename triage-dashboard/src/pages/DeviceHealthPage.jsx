import { useEffect, useState } from "react";
import DeviceHealthGrid from "../components/dashboard/DeviceHealthGrid";
import { loadDeviceHealthSnapshot } from "../services/dashboardApi";

function DeviceHealthPage() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const snapshot = await loadDeviceHealthSnapshot();
      if (!cancelled) {
        setDevices(snapshot?.devices ?? []);
      }
    };

    hydrate();
    const intervalId = window.setInterval(hydrate, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="portal-page-shell" aria-live="polite">
      <section className="portal-page-panel">
        <h1>Device Health</h1>
        <p className="portal-page-note">
          Fleet status for all available wearables in inventory.
        </p>
        <DeviceHealthGrid devices={devices} />
      </section>
    </main>
  );
}

export default DeviceHealthPage;
