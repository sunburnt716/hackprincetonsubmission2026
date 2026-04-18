import { Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import AppNavbar from "./components/layout/AppNavbar";
import PortalShell from "./components/layout/PortalShell";
import { APP_ROUTES } from "./constants/routes";
import Dashboard from "./pages/Dashboard";
import DashboardPatientTemplate from "./pages/DashboardPatientTemplate";
import DeviceHealthPage from "./pages/DeviceHealthPage";
import ForgotPassword from "./pages/ForgotPassword";
import IntakePairingPage from "./pages/IntakePairingPage";
import Login from "./pages/Signin";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import VitalsProvider from "./providers/VitalsProvider";
import RequireAuth from "./routes/RequireAuth";
import RequireRole from "./routes/RequireRole";
import "./App.css";

function PlaceholderPage({ title, message }) {
  return (
    <main className="placeholder-page" aria-live="polite">
      <h1>{title}</h1>
      <p>{message}</p>
    </main>
  );
}

function PublicShell() {
  return (
    <>
      <AppNavbar />
      <Outlet />
    </>
  );
}

function LegacyPatientDetailRedirect() {
  const { patientId } = useParams();
  return <Navigate to={`/portal/triage/patient/${patientId}`} replace />;
}

function PortalOperationalShell() {
  return (
    <VitalsProvider>
      <Outlet />
    </VitalsProvider>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route
          path={APP_ROUTES.ROOT}
          element={<Navigate to={APP_ROUTES.LOGIN} replace />}
        />
        <Route path={APP_ROUTES.LOGIN} element={<Login />} />
        <Route path={APP_ROUTES.SIGNUP} element={<Signup />} />
        <Route path={APP_ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route
          path={APP_ROUTES.AUTH_PENDING_VERIFICATION}
          element={
            <PlaceholderPage
              title="Verification Pending"
              message="Placeholder route: staff verification workflow will be implemented once backend services are available."
            />
          }
        />

        {/* Legacy route redirects */}
        <Route
          path={APP_ROUTES.DASHBOARD}
          element={<Navigate to={APP_ROUTES.PORTAL_TRIAGE} replace />}
        />
        <Route
          path={APP_ROUTES.DASHBOARD_PATIENT_DETAIL}
          element={<LegacyPatientDetailRedirect />}
        />
        <Route
          path={APP_ROUTES.SETTINGS}
          element={<Navigate to={APP_ROUTES.PORTAL_SETTINGS} replace />}
        />
        <Route
          path={APP_ROUTES.STAFF_HOME}
          element={<Navigate to={APP_ROUTES.PORTAL_TRIAGE} replace />}
        />
        <Route
          path={APP_ROUTES.PATIENT_HOME}
          element={<Navigate to={APP_ROUTES.PORTAL_PATIENT_HOME} replace />}
        />
      </Route>

      <Route
        path={APP_ROUTES.PORTAL_ROOT}
        element={
          <RequireAuth>
            <PortalShell />
          </RequireAuth>
        }
      >
        <Route
          index
          element={<Navigate to={APP_ROUTES.PORTAL_TRIAGE} replace />}
        />
        <Route element={<PortalOperationalShell />}>
          <Route path="triage" element={<Dashboard />} />
          <Route
            path="triage/patient/:patientId"
            element={<DashboardPatientTemplate />}
          />
          <Route path="intake" element={<IntakePairingPage />} />
          <Route path="devices" element={<DeviceHealthPage />} />
        </Route>
        <Route
          path="analytics"
          element={
            <RequireRole allowedRoles={["admin"]}>
              <PlaceholderPage
                title="Admin Analytics"
                message="Portal v1 placeholder: admin analytics are restricted until admin roles are enabled."
              />
            </RequireRole>
          }
        />
        <Route path="settings" element={<Settings />} />
        <Route
          path="patient"
          element={
            <PlaceholderPage
              title="Patient Home"
              message="Portal v1 placeholder: patient-specific workspace will be defined in a future phase."
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={APP_ROUTES.LOGIN} replace />} />
    </Routes>
  );
}

export default App;
