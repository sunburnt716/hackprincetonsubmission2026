import { API_ROUTES } from "../constants/apiRoutes";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://127.0.0.1:8000";

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const loadWaitingRoomSnapshot = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ROUTES.DASHBOARD_WAITING_ROOM}`,
    );

    if (!response.ok) {
      return null;
    }

    return safeJson(response);
  } catch {
    return null;
  }
};

export const loadDeviceHealthSnapshot = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ROUTES.DASHBOARD_DEVICE_HEALTH}`,
    );

    if (!response.ok) {
      return null;
    }

    return safeJson(response);
  } catch {
    return null;
  }
};

export const loadCriticalMomentsSnapshot = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ROUTES.DASHBOARD_CRITICAL_MOMENTS}`,
    );

    if (!response.ok) {
      return null;
    }

    return safeJson(response);
  } catch {
    return null;
  }
};
