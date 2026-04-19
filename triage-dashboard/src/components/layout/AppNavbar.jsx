import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";
import {
  clearCurrentSession,
  getCurrentSession,
  hasActiveSession,
  refreshCurrentSession,
} from "../../services/authService";
import "./AppNavbar.css";

function AppNavbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isSignedIn = hasActiveSession();
  const session = useMemo(
    () => (isSignedIn ? getCurrentSession() : null),
    [isSignedIn],
  );

  const handleLogout = () => {
    clearCurrentSession();
    setMenuOpen(false);
    navigate(APP_ROUTES.LOGIN);
  };

  useEffect(() => {
    if (!isSignedIn || !session?.accessToken) {
      return undefined;
    }

    let cancelled = false;
    const refresh = async () => {
      const refreshedSession = await refreshCurrentSession();
      if (cancelled) {
        return;
      }

      if (!refreshedSession) {
        setMenuOpen(false);
        navigate(APP_ROUTES.LOGIN);
      }
    };

    const intervalId = window.setInterval(
      () => {
        void refresh();
      },
      5 * 60 * 1000,
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isSignedIn, navigate, session?.accessToken]);

  return (
    <header className="app-navbar" aria-label="Primary navigation">
      <Link className="app-navbar__brand" to={APP_ROUTES.ROOT}>
        Kinovo Triage
      </Link>

      <div className="app-navbar__profile">
        <button
          type="button"
          className="profile-trigger"
          onClick={() => setMenuOpen((current) => !current)}
          aria-expanded={menuOpen}
          aria-controls="profile-menu"
        >
          Profile ▾
        </button>

        {menuOpen ? (
          <div id="profile-menu" className="profile-menu" role="menu">
            {isSignedIn ? (
              <div className="profile-menu__identity">
                <strong>{session?.fullName || session?.email}</strong>
                <br />
                <span>{session?.accountType}</span>
              </div>
            ) : null}

            {isSignedIn ? (
              <>
                <Link
                  to={APP_ROUTES.PORTAL_TRIAGE}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to={APP_ROUTES.PORTAL_SETTINGS}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
                <button type="button" role="menuitem" onClick={handleLogout}>
                  Log-out
                </button>
              </>
            ) : (
              <>
                <Link
                  to={APP_ROUTES.LOGIN}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Log-in
                </Link>
                <Link
                  to={APP_ROUTES.SIGNUP}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign-up
                </Link>
              </>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default AppNavbar;
