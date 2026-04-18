import { Navigate, Route, Routes } from "react-router-dom";
import AppNavbar from "./components/layout/AppNavbar";
import { APP_ROUTES } from "./constants/routes";
import Dashboard from "./pages/Dashboard";
import DashboardPatientTemplate from "./pages/DashboardPatientTemplate";
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Signin";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import "./App.css";

function PlaceholderPage({ title, message }) {
  return (
    <main className="placeholder-page" aria-live="polite">
      <h1>{title}</h1>
      <p>{message}</p>
    </main>
  );
}

function App() {
  return (
    <>
      <AppNavbar />
      <Routes>
        <Route
          path={APP_ROUTES.ROOT}
          element={<Navigate to={APP_ROUTES.LOGIN} replace />}
        />
        <Route path={APP_ROUTES.LOGIN} element={<Login />} />
        <Route path={APP_ROUTES.SIGNUP} element={<Signup />} />
        <Route path={APP_ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={APP_ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route
          path={APP_ROUTES.DASHBOARD_PATIENT_DETAIL}
          element={<DashboardPatientTemplate />}
        />
        <Route path={APP_ROUTES.SETTINGS} element={<Settings />} />
        <Route
          path={APP_ROUTES.PATIENT_HOME}
          element={
            <PlaceholderPage
              title="Patient Home"
              message="Placeholder route: this page will connect to patient dashboard APIs when backend is ready."
            />
          }
        />
        <Route
          path={APP_ROUTES.STAFF_HOME}
          element={<Navigate to={APP_ROUTES.DASHBOARD} replace />}
        />
        <Route
          path={APP_ROUTES.AUTH_PENDING_VERIFICATION}
          element={
            <PlaceholderPage
              title="Verification Pending"
              message="Placeholder route: staff verification workflow will be implemented once backend services are available."
            />
          }
        />
        <Route path="*" element={<Navigate to={APP_ROUTES.LOGIN} replace />} />
      </Routes>
    </>
  );
}

export default App;
