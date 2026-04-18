import { useMemo, useState } from "react";
import {
  createTemporaryPatientAccount,
  findRegisteredAccountByEmail,
} from "../../services/authService.mock";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AddPatientModal({ isOpen, onClose, onAddPatient, currentSession }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [registrationType, setRegistrationType] = useState("registered");
  const [error, setError] = useState("");

  const lookupResult = useMemo(() => {
    if (!EMAIL_REGEX.test(email.trim())) {
      return null;
    }

    return findRegisteredAccountByEmail(email);
  }, [email]);

  if (!isOpen) {
    return null;
  }

  const handleLookupAdd = () => {
    setError("");

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid patient email for lookup.");
      return;
    }

    if (!lookupResult) {
      setError(
        "No registered patient account found. Create a temporary account below.",
      );
      return;
    }

    if (lookupResult.accountType !== "patient") {
      setError("This account is not a patient account.");
      return;
    }

    onAddPatient(lookupResult);
    onClose();
  };

  const handleTemporaryCreate = () => {
    setError("");

    if (!fullName.trim()) {
      setError(
        "Please enter the patient full name for temporary registration.",
      );
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError(
        "Please enter a valid patient email for temporary registration.",
      );
      return;
    }

    const temporaryAccount = createTemporaryPatientAccount({
      fullName: fullName.trim(),
      email: email.trim(),
      createdByLoginId: currentSession.loginId,
    });

    onAddPatient(temporaryAccount);
    onClose();
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
            After adding a patient, connect a wearable to begin active tracking.
          </p>

          <label htmlFor="lookup-email">Patient Email (lookup)</label>
          <input
            id="lookup-email"
            type="email"
            placeholder="patient@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <fieldset className="inline-choice-group">
            <legend>Is this patient already registered?</legend>
            <label>
              <input
                type="radio"
                name="registration-type"
                value="registered"
                checked={registrationType === "registered"}
                onChange={(event) => setRegistrationType(event.target.value)}
              />
              Yes, registered
            </label>
            <label>
              <input
                type="radio"
                name="registration-type"
                value="unregistered"
                checked={registrationType === "unregistered"}
                onChange={(event) => setRegistrationType(event.target.value)}
              />
              No, not registered
            </label>
          </fieldset>

          {registrationType === "registered" ? (
            <>
              {lookupResult ? (
                <p className="inline-note">
                  Registered patient found:{" "}
                  <strong>{lookupResult.fullName}</strong>
                </p>
              ) : (
                <p className="inline-note">
                  No registered patient match found yet
                </p>
              )}

              <button
                type="button"
                className="primary-action"
                onClick={handleLookupAdd}
              >
                Add Registered Patient
              </button>
            </>
          ) : (
            <>
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
                className="secondary-action"
                onClick={handleTemporaryCreate}
              >
                Create Temporary Patient Account
              </button>

              <p className="inline-note">
                Temporary accounts are marked for follow-up signup completion
              </p>
            </>
          )}

          {error ? <p className="auth-error">{error}</p> : null}
        </div>
      </section>
    </div>
  );
}

export default AddPatientModal;
