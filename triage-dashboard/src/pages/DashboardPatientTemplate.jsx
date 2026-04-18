import { useParams } from "react-router-dom";

function DashboardPatientTemplate() {
  const { patientId } = useParams();

  return (
    <main className="placeholder-page" aria-live="polite">
      <h1>Patient Route Template</h1>
      <p>
        Template route only for patient <strong>{patientId}</strong>. Detailed
        backend timeline and record fetch will be connected in a later phase.
      </p>
    </main>
  );
}

export default DashboardPatientTemplate;
