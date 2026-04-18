import { Link } from "react-router-dom";
import { APP_ROUTES } from "../constants/routes";

function IntakePairingPage() {
  return (
    <main className="portal-page-shell" aria-live="polite">
      <section className="portal-page-panel">
        <h1>Patient Intake</h1>
        <p className="portal-page-note">
          This page is for step-by-step intake workflow. The goal is to complete
          intake in 3 steps:
        </p>

        <ol className="portal-page-steps">
          <li>
            <strong>Pair Device</strong> — choose a wearable and verify active
            reads.
          </li>
          <li>
            <strong>Assign Patient</strong> — link the wearable to a registered
            or temporary patient.
          </li>
          <li>
            <strong>Confirm Live Stream</strong> — verify battery and connection
            state before monitoring.
          </li>
        </ol>

        <p className="portal-page-note">
          In this v1, intake actions still happen inside the Live Queue view.
          This page defines the workflow purpose and will host the full wizard
          next.
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
