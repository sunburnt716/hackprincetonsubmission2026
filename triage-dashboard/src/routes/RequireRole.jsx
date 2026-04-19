import { Navigate } from "react-router-dom";
import { APP_ROUTES } from "../constants/routes";
import { getCurrentSession } from "../services/authService";

function RequireRole({ allowedRoles, children }) {
  const session = getCurrentSession();
  const role = session?.accountType ?? "staff";

  if (!allowedRoles.includes(role)) {
    return <Navigate to={APP_ROUTES.PORTAL_TRIAGE} replace />;
  }

  return children;
}

export default RequireRole;
