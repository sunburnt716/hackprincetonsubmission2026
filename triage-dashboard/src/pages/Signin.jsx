import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ACCOUNT_TYPE_OPTIONS, ACCOUNT_TYPES } from "../constants/accountTypes";
import { APP_ROUTES } from "../constants/routes";
import { submitLogin } from "../services/authService.mock";
import "./Auth.css";

const INITIAL_STATE = {
  accountType: ACCOUNT_TYPES.PATIENT,
  email: "",
  password: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleAccountTypeSelect = (accountType) => {
    setFormData((current) => ({ ...current, accountType }));
  };

  const validate = () => {
    if (!formData.email.trim()) {
      return "Please enter your email.";
    }

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!formData.password.trim()) {
      return "Please enter your password.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setNote("");
      setError(validationError);
      return;
    }

    const response = await submitLogin({
      accountType: formData.accountType,
      email: formData.email.trim(),
      password: formData.password,
    });

    setNote(
      `Mock endpoint: ${response.endpoint} | Standardized login ID: ${response.payload.loginId}`,
    );

    if (formData.accountType === ACCOUNT_TYPES.STAFF) {
      navigate(APP_ROUTES.STAFF_HOME);
      return;
    }

    navigate(APP_ROUTES.PATIENT_HOME);
  };

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="login-title">
        <h1 id="login-title">Log-in</h1>
        <p className="auth-subtext">
          Frontend-only auth placeholder for patient and hospital staff
          accounts.
        </p>

        <nav className="auth-tabs" aria-label="Authentication pages">
          <Link className="auth-tab active" to={APP_ROUTES.LOGIN}>
            Sign-in
          </Link>
          <Link className="auth-tab" to={APP_ROUTES.SIGNUP}>
            Sign-up
          </Link>
        </nav>

        <div
          className="auth-type-toggle"
          role="group"
          aria-label="Account type selector"
        >
          <p>Account Type</p>
          <div className="auth-type-options">
            {ACCOUNT_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`auth-type-option ${
                  formData.accountType === option.value ? "selected" : ""
                }`}
                onClick={() => handleAccountTypeSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field--full">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="yourname@hospital.org"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="auth-field--full">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {error ? <p className="auth-error">{error}</p> : null}
          {note ? <p className="auth-note">{note}</p> : null}

          <div className="auth-actions">
            <Link className="auth-link" to={APP_ROUTES.SIGNUP}>
              Need an account? Sign-up
            </Link>
            <button className="auth-submit" type="submit">
              Sign-in
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Login;
