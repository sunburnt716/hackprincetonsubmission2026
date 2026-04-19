import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "../constants/routes";
import { loadCriticalMomentsSnapshot } from "../services/dashboardApi";

function IntakePairingPage() {
  const [moments, setMoments] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const snapshot = await loadCriticalMomentsSnapshot();
      if (!cancelled) {
        setMoments(snapshot?.moments ?? []);
      }
    };

    hydrate();
    const intervalId = window.setInterval(hydrate, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const topMoments = useMemo(() => moments.slice(0, 50), [moments]);

  return (
    <main className="portal-page-shell" aria-live="polite">
      <section className="portal-page-panel">
        <h1>Patient History</h1>
        <p className="portal-page-note">
          Critical-moment history for staff triage review. Entries are sorted
          newest first and include surrounding vitals context.
        </p>

        <div
          className="history-grid"
          role="table"
          aria-label="Critical moments history"
        >
          <div className="history-grid__header" role="row">
            <span>Time</span>
            <span>Patient</span>
            <span>Situation</span>
            <span>Observed Vitals</span>
            <span>Window</span>
          </div>

          {topMoments.length > 0 ? (
            topMoments.map((moment) => (
              <article
                key={moment.eventId}
                className="history-grid__row"
                role="row"
              >
                <span>
                  {moment.occurredAt
                    ? new Date(moment.occurredAt).toLocaleString()
                    : "Unknown"}
                </span>
                <span>
                  <strong>{moment.patientName ?? "Unknown"}</strong>
                  <br />
                  <small>{moment.patientId ?? "N/A"}</small>
                </span>
                <span>{moment.reason ?? "critical_event"}</span>
                <span>
                  SpO₂ {moment.observedValue?.bloodOxygen ?? "--"}% · BPM{" "}
                  {moment.observedValue?.heartBeat ?? "--"} · Stress{" "}
                  {moment.observedValue?.stress ?? "--"}
                </span>
                <span>
                  {moment.beforeSeconds ?? 3}s before /{" "}
                  {moment.afterSeconds ?? 3}s after
                </span>
              </article>
            ))
          ) : (
            <p className="portal-page-note">
              No critical moments captured yet.
            </p>
          )}
        </div>

        <p className="portal-page-note">
          Intake + pairing still happen in Live Queue. This page is now focused
          on reviewing critical episodes and associated vitals windows.
        </p>

        <div className="portal-page-actions">
          <Link className="primary-action" to={APP_ROUTES.PORTAL_TRIAGE}>
            Open Live Queue
          </Link>
          <Link className="secondary-action" to={APP_ROUTES.PORTAL_DEVICES}>
            Open Device Health
          </Link>
        </div>
      </section>
    </main>
  );
}

export default IntakePairingPage;
