import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../constants/routes";
import { useTheme } from "../providers/useTheme";
import {
  changeCurrentPassword,
  clearCurrentSession,
  deleteCurrentAccount,
  getCurrentSession,
} from "../services/authService.mock";

function Settings() {
  const { themeMode, resolvedTheme, setThemeMode, themeModes } = useTheme();
  const navigate = useNavigate();
  const session = getCurrentSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const resetMessages = () => {
    setError("");
    setNote("");
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!session) {
      setError("Please sign in before changing your password.");
      return;
    }

    if (!currentPassword.trim() || !newPassword.trim()) {
      setError("Please fill in your current and new password.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      await changeCurrentPassword({
        currentPassword,
        newPassword,
      });
      setNote("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Unable to update password right now.",
      );
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    resetMessages();

    if (!session) {
      setError("Please sign in before deleting your account.");
      return;
    }

    if (!deletePassword.trim()) {
      setError("Please confirm your current password before deleting.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this account? This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteCurrentAccount({ currentPassword: deletePassword });
      clearCurrentSession();
      navigate(APP_ROUTES.LOGIN);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the account right now.",
      );
    }
  };

  return (
    <main className="settings-page" aria-live="polite">
      <section className="settings-panel">
        <h1>Settings</h1>
        <p>
          Theme preference is saved locally for now and can be migrated to the
          backend settings endpoint in a later phase.
        </p>

        <div
          className="settings-group"
          role="radiogroup"
          aria-label="Theme mode"
        >
          <h2>Theme</h2>

          <label className="settings-option">
            <input
              type="radio"
              name="theme-mode"
              value={themeModes.SYSTEM}
              checked={themeMode === themeModes.SYSTEM}
              onChange={(event) => setThemeMode(event.target.value)}
            />
            System
          </label>

          <label className="settings-option">
            <input
              type="radio"
              name="theme-mode"
              value={themeModes.LIGHT}
              checked={themeMode === themeModes.LIGHT}
              onChange={(event) => setThemeMode(event.target.value)}
            />
            Light
          </label>

          <label className="settings-option">
            <input
              type="radio"
              name="theme-mode"
              value={themeModes.DARK}
              checked={themeMode === themeModes.DARK}
              onChange={(event) => setThemeMode(event.target.value)}
            />
            Dark
          </label>
        </div>

        <p className="settings-note">
          Current mode: <strong>{themeMode}</strong> · Resolved palette:{" "}
          <strong>{resolvedTheme}</strong>
        </p>

        <div className="settings-group">
          <h2>Security</h2>

          {session ? (
            <>
              <p className="settings-note">
                Signed in as{" "}
                <strong>{session.fullName || session.email}</strong>
              </p>

              <form className="settings-form" onSubmit={handlePasswordChange}>
                <label className="settings-option" htmlFor="current-password">
                  Current password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />

                <label className="settings-option" htmlFor="new-password">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />

                <label
                  className="settings-option"
                  htmlFor="confirm-new-password"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) =>
                    setConfirmNewPassword(event.target.value)
                  }
                />

                <button className="primary-action" type="submit">
                  Update password
                </button>
              </form>

              <form className="settings-form" onSubmit={handleDeleteAccount}>
                <h3>Delete account</h3>
                <p className="settings-note">
                  This permanently deletes the account and signs you out.
                </p>

                <label className="settings-option" htmlFor="delete-password">
                  Current password
                </label>
                <input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                />

                <button className="secondary-action" type="submit">
                  Delete account
                </button>
              </form>
            </>
          ) : (
            <p className="settings-note">
              You must be signed in to change your password or delete your
              account. <Link to={APP_ROUTES.LOGIN}>Sign in</Link> or use the{" "}
              <Link to={APP_ROUTES.FORGOT_PASSWORD}>forgot password</Link> link
              to recover access.
            </p>
          )}

          {error ? <p className="auth-error">{error}</p> : null}
          {note ? <p className="auth-note">{note}</p> : null}
        </div>
      </section>
    </main>
  );
}

export default Settings;
