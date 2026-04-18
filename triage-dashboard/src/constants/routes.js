export const APP_ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",

  PORTAL_ROOT: "/portal",
  PORTAL_TRIAGE: "/portal/triage",
  PORTAL_TRIAGE_PATIENT_DETAIL: "/portal/triage/patient/:patientId",
  PORTAL_INTAKE: "/portal/intake",
  PORTAL_DEVICES: "/portal/devices",
  PORTAL_ANALYTICS: "/portal/analytics",
  PORTAL_SETTINGS: "/portal/settings",
  PORTAL_PATIENT_HOME: "/portal/patient",

  // Legacy routes (kept for backward compatibility redirects)
  DASHBOARD: "/dashboard",
  DASHBOARD_PATIENT_DETAIL: "/dashboard/patient/:patientId",
  SETTINGS: "/settings",
  PATIENT_HOME: "/patient/home",
  STAFF_HOME: "/staff/home",
  AUTH_PENDING_VERIFICATION: "/auth/pending-verification",
};
