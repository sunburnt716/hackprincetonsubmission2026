import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../constants/routes";
import {
  confirmPasswordReset,
  requestPasswordReset,
} from "../services/authService";
import "./Auth.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");

  const requestToken = async (event) => {
    event.preventDefault();
    setError("");
    setNote("");

    if (!email.trim()) {
      setError("Please enter the email address on the account.");
      return;
    }

    try {
      const response = await requestPasswordReset({ email: email.trim() });
      setGeneratedToken(response.reset_token ?? "");
      if (response.reset_token) {
        setResetToken(response.reset_token);
      }
      setNote(response.message || "Reset token requested.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to request a reset token right now.",
      );
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setNote("");

    if (!email.trim() || !resetToken.trim()) {
      setError("Please enter your email and reset token.");
      return;
    }

    if (!newPassword.trim()) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      const response = await confirmPasswordReset({
        email: email.trim(),
        resetToken: resetToken.trim(),
        newPassword,
        confirmNewPassword,
      });
      setNote(response.message || "Password reset successfully.");
      navigate(APP_ROUTES.DASHBOARD);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to reset your password right now.",
      );
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="forgot-password-title">
        <h1 id="forgot-password-title">Password Recovery</h1>
        <p className="auth-subtext">
          Request a reset token, then use it to choose a new password. In demo
          mode, the token is shown here instead of being emailed.
        </p>

        <nav className="auth-tabs" aria-label="Authentication pages">
          <Link className="auth-tab" to={APP_ROUTES.LOGIN}>
            Sign-in
          </Link>
          <Link className="auth-tab active" to={APP_ROUTES.FORGOT_PASSWORD}>
            Recover password
          </Link>
        </nav>

        <form className="auth-form" onSubmit={requestToken} noValidate>
          <div className="auth-field--full">
            <label htmlFor="recovery-email">Email</label>
            <input
              id="recovery-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <button className="secondary-action" type="submit">
            Request reset token
          </button>
        </form>

        {generatedToken ? (
          <p className="settings-note">
            Demo reset token: <strong>{generatedToken}</strong>
          </p>
        ) : null}

        <form className="auth-form" onSubmit={handleResetPassword} noValidate>
          <div className="auth-field--full">
            <label htmlFor="reset-token">Reset Token</label>
            <input
              id="reset-token"
              type="text"
              value={resetToken}
              onChange={(event) => setResetToken(event.target.value)}
            />
          </div>

          <div className="auth-field--full">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>

          <div className="auth-field--full">
            <label htmlFor="confirm-new-password">Confirm New Password</label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
            />
          </div>

          <button className="primary-action" type="submit">
            Reset password
          </button>
        </form>

        {error ? <p className="auth-error">{error}</p> : null}
        {note ? <p className="auth-note">{note}</p> : null}
      </section>
    </main>
  );
}

export default ForgotPassword;
