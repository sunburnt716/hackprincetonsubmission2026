export const MOCK_API_ROUTES = {
  PATIENT_SIGNUP: "/api/v1/auth/patient/sign-up",
  PATIENT_LOGIN: "/api/v1/auth/patient/log-in",
  STAFF_SIGNUP: "/api/v1/auth/staff/sign-up",
  STAFF_LOGIN: "/api/v1/auth/staff/log-in",
  AUTH_ME: "/api/v1/auth/me",
  AUTH_SESSION_REFRESH: "/api/v1/auth/session/refresh",
  AUTH_PASSWORD_CHANGE: "/api/v1/auth/me/password",
  AUTH_PASSWORD_FORGOT: "/api/v1/auth/password/forgot",
  AUTH_PASSWORD_RESET: "/api/v1/auth/password/reset",
  DASHBOARD_WAITING_ROOM: "/api/v1/dashboard/waiting-room",
  DASHBOARD_ADD_PATIENT: "/api/v1/dashboard/waiting-room/add-patient",
  DASHBOARD_PATIENT_DETAIL: "/api/v1/dashboard/patient/:patientId",
  DASHBOARD_DEVICE_HEALTH: "/api/v1/dashboard/device-health",
  DASHBOARD_AVAILABLE_WEARABLES: "/api/v1/dashboard/devices/available",
  DASHBOARD_WEARABLE_PRECHECK: "/api/v1/dashboard/devices/:deviceId/precheck",
  DASHBOARD_BIND_WEARABLE:
    "/api/v1/dashboard/waiting-room/:patientId/bind-device",
  DASHBOARD_UNBIND_WEARABLE:
    "/api/v1/dashboard/waiting-room/:patientId/unbind-device",
  DASHBOARD_PAIRING_STATUS:
    "/api/v1/dashboard/waiting-room/:patientId/pairing-status",
  DASHBOARD_SETTINGS: "/api/v1/settings",
};
