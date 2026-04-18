import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../constants/routes";
import {
  clearCurrentSession,
  getCurrentSession,
  refreshCurrentSession,
} from "../../services/authService.mock";
import PortalSidebar from "./PortalSidebar";
import PortalTrustStrip from "./PortalTrustStrip";
import "./PortalShell.css";

const normalizeRole = (accountType) => {
  if (accountType === "admin" || accountType === "patient") {
    return accountType;
  }

  return "staff";
};

function PortalShell() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getCurrentSession());
  const [lastSuccessfulSyncAt, setLastSuccessfulSyncAt] = useState(() =>
    new Date().toISOString(),
  );

  useEffect(() => {
    if (!session?.accessToken) {
      return undefined;
    }

    let cancelled = false;

    const refresh = async () => {
      const refreshedSession = await refreshCurrentSession();
      if (cancelled) {
        return;
      }

      if (!refreshedSession) {
        clearCurrentSession();
        navigate(APP_ROUTES.LOGIN, { replace: true });
        return;
      }

      setSession(refreshedSession);
      setLastSuccessfulSyncAt(new Date().toISOString());
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
  }, [navigate, session?.accessToken]);

  const handleLogout = () => {
    clearCurrentSession();
    navigate(APP_ROUTES.LOGIN, { replace: true });
  };

  const identity = useMemo(
    () => ({
      displayName: session?.fullName || session?.email || "Clinical User",
      role: normalizeRole(session?.accountType),
      facilityName: session?.facilityName || null,
    }),
    [
      session?.accountType,
      session?.email,
      session?.facilityName,
      session?.fullName,
    ],
  );

  const reliabilityRail = useMemo(
    () => ({
      syncState: session?.accessToken ? "live" : "offline",
      unsyncedCount: 0,
      lastSuccessfulSyncAt,
      stalePatientCount: 0,
    }),
    [lastSuccessfulSyncAt, session?.accessToken],
  );

  return (
    <div className="portal-shell">
      <a className="portal-shell__skip-link" href="#portal-main-content">
        Skip to main content
      </a>
      <PortalSidebar identity={identity} />

      <div className="portal-shell__workspace">
        <PortalTrustStrip
          reliabilityRail={reliabilityRail}
          onLogout={handleLogout}
        />

        <main id="portal-main-content" className="portal-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PortalShell;
