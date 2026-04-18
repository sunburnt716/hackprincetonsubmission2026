import { Navigate, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../constants/routes";
import { hasActiveSession } from "../services/authService.mock";

function RequireAuth({ children }) {
  const location = useLocation();

  if (!hasActiveSession()) {
    return (
      <Navigate
        to={APP_ROUTES.LOGIN}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

export default RequireAuth;
