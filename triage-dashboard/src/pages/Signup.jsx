import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ACCOUNT_TYPES } from "../constants/accountTypes";
import { APP_ROUTES } from "../constants/routes";
import { submitSignup } from "../services/authService";
import "./Auth.css";

const INITIAL_STATE = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  staffRole: "",
  hospitalName: "",
  facilityId: "",
  staffId: "",
  department: "",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STAFF_FIELDS = [
  { name: "staffRole", label: "Staff Role", type: "text" },
  { name: "hospitalName", label: "Hospital Name", type: "text" },
  { name: "facilityId", label: "Facility ID", type: "text" },
  { name: "staffId", label: "Staff ID (Optional)", type: "text" },
  { name: "department", label: "Department (Optional)", type: "text" },
];

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    if (!formData.fullName.trim()) {
      return "Please enter your full name.";
    }

    if (!formData.email.trim()) {
      return "Please enter your email.";
    }

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (formData.password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }

    if (!formData.staffRole.trim()) {
      return "Please provide a staff role.";
    }

    if (!formData.hospitalName.trim()) {
      return "Please provide a hospital name.";
    }

    if (!formData.facilityId.trim()) {
      return "Please provide a facility ID.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNote("");

    const validationError = validate();
    if (validationError) {
      setNote("");
      setError(validationError);
      return;
    }

    try {
      const response = await submitSignup({
        accountType: ACCOUNT_TYPES.STAFF,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        profile: {
          staffRole: formData.staffRole,
          hospitalName: formData.hospitalName,
          facilityId: formData.facilityId,
          staffId: formData.staffId,
          department: formData.department,
        },
      });

      setNote(
        `Endpoint: ${response.endpoint} | Login ID: ${response.payload.loginId}`,
      );

      navigate(APP_ROUTES.STAFF_HOME);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to complete Sign-up right now.";

      setError(`Sign-up failed before redirect. ${message}`);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="signup-title">
        <h1 id="signup-title">Hospital Staff Sign-up</h1>
        <p className="auth-subtext">
          Create a hospital staff account to access the triage portal.
        </p>

        <nav className="auth-tabs" aria-label="Authentication pages">
          <Link className="auth-tab" to={APP_ROUTES.LOGIN}>
            Log-in
          </Link>
          <Link className="auth-tab active" to={APP_ROUTES.SIGNUP}>
            Sign-up
          </Link>
        </nav>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          {STAFF_FIELDS.map((field) => (
            <div key={field.name} className="auth-field--full">
              <label htmlFor={field.name}>{field.label}</label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                value={formData[field.name]}
                onChange={handleChange}
              />
            </div>
          ))}

          {error ? <p className="auth-error">{error}</p> : null}
          {note ? <p className="auth-note">{note}</p> : null}

          <div className="auth-actions">
            <Link className="auth-link" to={APP_ROUTES.LOGIN}>
              Already registered? Log-in
            </Link>
            <button className="auth-submit" type="submit">
              Sign-up
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default Signup;
