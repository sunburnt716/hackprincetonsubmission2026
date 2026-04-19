import { useState } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AddPatientModal({ isOpen, onClose, onAddPatient, currentSession }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [temporary, setTemporary] = useState(true);
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const handleAddPatient = async () => {
    setError("");

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid patient email.");
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter the patient full name.");
      return;
    }

    try {
      await onAddPatient({
        fullName: fullName.trim(),
        email: email.trim(),
        temporary,
        createdByLoginId: currentSession?.loginId ?? "staff:guest@kinovo.local",
      });
      onClose();
    } catch (caughtError) {
      setError(
        caughtError?.message ||
          "Unable to add patient right now. Please try again.",
      );
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="dashboard-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-patient-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dashboard-modal__header">
          <h2 id="add-patient-title">Add Patient to Waiting Room</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="dashboard-modal__content">
          <p className="inline-note">
            After adding a patient, you can connect a wearable now or skip and
            pair later.
          </p>

          <label htmlFor="lookup-email">Patient Email</label>
          <input
            id="lookup-email"
            type="email"
            placeholder="patient@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <fieldset className="inline-choice-group">
            <legend>Account status</legend>
            <label>
              <input
                type="radio"
                name="registration-type"
                checked={temporary}
                onChange={() => setTemporary(true)}
              />
              Temporary intake account
            </label>
            <label>
              <input
                type="radio"
                name="registration-type"
                checked={!temporary}
                onChange={() => setTemporary(false)}
              />
              Registered account
            </label>
          </fieldset>

          <label htmlFor="temp-name">Patient Full Name</label>
          <input
            id="temp-name"
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />

          <button
            type="button"
            className="primary-action"
            onClick={handleAddPatient}
          >
            Add Patient
          </button>

          <p className="inline-note">
            {temporary
              ? "Temporary accounts are marked for follow-up signup completion"
              : "Registered patients are added directly to active monitoring"}
          </p>

          {error ? <p className="auth-error">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}

export default AddPatientModal;
