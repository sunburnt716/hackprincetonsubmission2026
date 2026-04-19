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

const parseErrorMessage = async (response, fallback) => {
  const payload = await safeJson(response);
  return payload?.detail || payload?.message || fallback;
};

const routeWithParam = (route, params) =>
  Object.entries(params).reduce(
    (nextRoute, [key, value]) =>
      nextRoute.replace(`:${key}`, encodeURIComponent(value)),
    route,
  );

export const sortTriageQueue = (patients) =>
  [...patients].sort((a, b) => {
    const aCritical = Boolean(a.uiState?.isCritical);
    const bCritical = Boolean(b.uiState?.isCritical);
    if (aCritical !== bCritical) {
      return Number(bCritical) - Number(aCritical);
    }

    const aSpo2 = a.clinicalPayload?.vitals?.bloodOxygen ?? 100;
    const bSpo2 = b.clinicalPayload?.vitals?.bloodOxygen ?? 100;
    if (aSpo2 !== bSpo2) {
      return aSpo2 - bSpo2;
    }

    const aTs = a.clinicalPayload?.timestamp ?? "";
    const bTs = b.clinicalPayload?.timestamp ?? "";
    if (aTs !== bTs) {
      return bTs.localeCompare(aTs);
    }

    return (a.patientId ?? "").localeCompare(b.patientId ?? "");
  });

export const getQueue = async () => {
  const response = await fetch(
    `${API_BASE_URL}${API_ROUTES.DASHBOARD_WAITING_ROOM}`,
  );
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Unable to load queue."));
  }

  const payload = await safeJson(response);
  const patients = sortTriageQueue(payload?.patients ?? []);
  return {
    ...payload,
    patients,
  };
};

export const addPatientFromIntake = async ({
  fullName,
  email,
  temporary,
  createdByLoginId,
}) => {
  const response = await fetch(
    `${API_BASE_URL}${API_ROUTES.DASHBOARD_ADD_PATIENT}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
        temporary,
        created_by_login_id: createdByLoginId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Unable to add patient."),
    );
  }

  return safeJson(response);
};

export const getAvailableWearables = async () => {
  const response = await fetch(
    `${API_BASE_URL}${API_ROUTES.DASHBOARD_AVAILABLE_WEARABLES}`,
  );
  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Unable to load wearable inventory."),
    );
  }

  const payload = await safeJson(response);
  return payload?.devices ?? [];
};

export const runWearablePrecheck = async ({ patientId, deviceId }) => {
  const endpoint = routeWithParam(API_ROUTES.DASHBOARD_WEARABLE_PRECHECK, {
    deviceId,
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ patient_id: patientId }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Unable to run precheck."),
    );
  }

  return safeJson(response);
};

export const connectWearableToPatient = async ({ patientId, deviceId }) => {
  const endpoint = routeWithParam(API_ROUTES.DASHBOARD_BIND_WEARABLE, {
    patientId,
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ device_id: deviceId }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Unable to bind wearable."),
    );
  }

  return safeJson(response);
};

export const unbindWearableFromPatient = async ({ patientId }) => {
  const endpoint = routeWithParam(API_ROUTES.DASHBOARD_UNBIND_WEARABLE, {
    patientId,
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(
        response,
        "Unable to unbind wearable from patient.",
      ),
    );
  }

  return safeJson(response);
};

export const getPairingStatus = async ({ patientId }) => {
  const endpoint = routeWithParam(API_ROUTES.DASHBOARD_PAIRING_STATUS, {
    patientId,
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Unable to load pairing status."),
    );
  }

  return safeJson(response);
};

export const releasePatientFromWaitingRoom = async ({ patientId }) => {
  const endpoint = routeWithParam(API_ROUTES.DASHBOARD_RELEASE_PATIENT, {
    patientId,
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Unable to release patient."),
    );
  }

  return safeJson(response);
};
