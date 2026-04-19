import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";
import {
  clearCurrentSession,
  getCurrentSession,
  hasActiveSession,
  refreshCurrentSession,
} from "../../services/authService";

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
    <header
      className="sticky top-0 z-[60] flex items-center justify-between gap-4 border-b border-ink-200/80 bg-white/92 px-6 py-3 backdrop-blur-xl dark:border-ink-700/70 dark:bg-ink-900/85"
      aria-label="Primary navigation"
    >
      <Link
        className="flex items-center gap-2.5 text-ink-800 no-underline dark:text-ink-50"
        to={APP_ROUTES.ROOT}
      >
        <span
          aria-hidden
          className="inline-flex h-7 w-7 items-center justify-center rounded-[9px] bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_6px_16px_-4px_rgba(61,99,255,0.55)]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 7h3l1.5-4 3 8L10 7h3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="wordmark text-[19px] leading-none">Kinova</span>
      </Link>

      <div className="relative">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-[13.5px] font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-800/60 dark:text-ink-100 dark:hover:border-ink-600 dark:hover:bg-ink-800"
          onClick={() => setMenuOpen((current) => !current)}
          aria-expanded={menuOpen}
          aria-controls="profile-menu"
        >
          Profile
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
            <path
              d="M2.5 4 5 6.5 7.5 4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {menuOpen ? (
          <div
            id="profile-menu"
            className="absolute right-0 top-[calc(100%+8px)] grid min-w-[220px] gap-1 rounded-2xl border border-ink-100 bg-white p-2 shadow-[0_24px_48px_-20px_rgba(15,16,32,0.28),0_8px_16px_-8px_rgba(15,16,32,0.12)] dark:border-ink-700 dark:bg-ink-800 dark:shadow-[0_24px_48px_-20px_rgba(0,0,0,0.7),0_8px_16px_-8px_rgba(0,0,0,0.5)]"
            role="menu"
          >
            {isSignedIn ? (
              <div className="mb-1 border-b border-ink-100 px-2.5 pb-2 pt-1 text-[13px] text-ink-500 dark:border-ink-700 dark:text-ink-300">
                <strong className="block text-[13.5px] font-semibold text-ink-800 dark:text-ink-50">
                  {session?.fullName || session?.email}
                </strong>
                <span className="text-[12px] text-ink-400 dark:text-ink-300">
                  {session?.accountType}
                </span>
              </div>
            ) : null}

            {isSignedIn ? (
              <>
                <Link
                  to={APP_ROUTES.PORTAL_TRIAGE}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-ink-700 no-underline transition-colors hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-700/50"
                >
                  Dashboard
                </Link>
                <Link
                  to={APP_ROUTES.PORTAL_SETTINGS}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-ink-700 no-underline transition-colors hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-700/50"
                >
                  Settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="rounded-lg border border-transparent px-2.5 py-2 text-left text-[13.5px] font-medium text-ink-700 transition-colors hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-700/50"
                >
                  Log-out
                </button>
              </>
            ) : (
              <>
                <Link
                  to={APP_ROUTES.LOGIN}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-ink-700 no-underline transition-colors hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-700/50"
                >
                  Log-in
                </Link>
                <Link
                  to={APP_ROUTES.SIGNUP}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-ink-700 no-underline transition-colors hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-700/50"
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
