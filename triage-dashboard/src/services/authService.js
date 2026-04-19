import { ACCOUNT_TYPES } from "../constants/accountTypes";
import { API_ROUTES } from "../constants/apiRoutes";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://127.0.0.1:8000";

const SESSION_KEY = "kinovo.session.v1";

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const readJsonStorage = (key, fallbackValue) => {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return fallbackValue;
    }

    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
};

const writeJsonStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no-op when storage is unavailable
  }
};

const removeStorageKey = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // no-op when storage is unavailable
  }
};

const parseErrorMessage = async (response, fallback) => {
  const text = await response.text();
  if (!text) {
    return fallback;
  }

  try {
    const payload = JSON.parse(text);
    return payload.detail || payload.message || fallback;
  } catch {
    return text;
  }
};

const persistSession = ({
  accountType,
  loginId,
  email,
  fullName,
  accessToken = null,
  expiresInSeconds = null,
}) => {
  const expiresAt =
    typeof expiresInSeconds === "number"
      ? Date.now() + expiresInSeconds * 1000
      : null;

  writeJsonStorage(SESSION_KEY, {
    accountType,
    loginId,
    email: normalizeEmail(email),
    fullName: fullName?.trim() ?? "",
    accessToken,
    expiresAt,
    signedInAt: new Date().toISOString(),
  });
};

export const buildStandardizedLoginId = ({ accountType, email }) =>
  `${accountType}:${normalizeEmail(email)}`;

export const submitSignup = async (payload) => {
  if (payload.accountType !== ACCOUNT_TYPES.STAFF) {
    throw new Error(
      "Patient auth signup is not supported in this phase. Staff should add patients from the waiting-room intake flow.",
    );
  }

  const response = await fetch(`${API_BASE_URL}${API_ROUTES.STAFF_SIGNUP}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizeEmail(payload.email),
      password: payload.password,
      name: payload.fullName,
      age: payload.profile?.age ? Number(payload.profile.age) : null,
      hospital: payload.profile?.hospitalName ?? "Not set",
      position: payload.profile?.staffRole ?? "Not set",
    }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to create staff account."),
    );
  }

  const backendResult = await response.json();
  const loginId = buildStandardizedLoginId({
    accountType: payload.accountType,
    email: payload.email,
  });

  persistSession({
    accountType: payload.accountType,
    loginId,
    email: payload.email,
    fullName: backendResult.user?.name ?? payload.fullName,
    accessToken: backendResult.access_token,
    expiresInSeconds: backendResult.expires_in_seconds,
  });

  return {
    ok: true,
    endpoint: API_ROUTES.STAFF_SIGNUP,
    payload: {
      ...payload,
      email: normalizeEmail(payload.email),
      loginId,
      timestamp: new Date().toISOString(),
    },
    message: backendResult.message || "Staff account created successfully.",
  };
};

export const submitLogin = async (payload) => {
  if (payload.accountType !== ACCOUNT_TYPES.STAFF) {
    throw new Error(
      "Patient auth sign-in is not supported in this phase. Staff should handle intake and pairing workflows.",
    );
  }

  const response = await fetch(`${API_BASE_URL}${API_ROUTES.STAFF_LOGIN}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizeEmail(payload.email),
      password: payload.password,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response, "Failed to sign in."));
  }

  const backendResult = await response.json();
  const loginId = buildStandardizedLoginId({
    accountType: payload.accountType,
    email: payload.email,
  });

  persistSession({
    accountType: payload.accountType,
    loginId,
    email: payload.email,
    fullName: backendResult.user?.name ?? "",
    accessToken: backendResult.access_token,
    expiresInSeconds: backendResult.expires_in_seconds,
  });

  return {
    ok: true,
    endpoint: API_ROUTES.STAFF_LOGIN,
    payload: {
      ...payload,
      email: normalizeEmail(payload.email),
      loginId,
      timestamp: new Date().toISOString(),
    },
    message: backendResult.message || "Staff sign-in successful.",
  };
};

export const getCurrentSession = () => readJsonStorage(SESSION_KEY, null);

export const clearCurrentSession = () => {
  removeStorageKey(SESSION_KEY);
};

export const hasActiveSession = () => {
  const session = getCurrentSession();
  if (!session?.loginId || !session?.email || !session?.signedInAt) {
    return false;
  }

  if (session.expiresAt && Date.now() > session.expiresAt) {
    clearCurrentSession();
    return false;
  }

  return true;
};

export const refreshCurrentSession = async () => {
  const session = getCurrentSession();
  if (!session?.accessToken) {
    return null;
  }

  const response = await fetch(
    `${API_BASE_URL}${API_ROUTES.AUTH_SESSION_REFRESH}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    },
  );

  if (!response.ok) {
    clearCurrentSession();
    return null;
  }

  const backendResult = await response.json();
  persistSession({
    accountType: session.accountType,
    loginId: session.loginId,
    email: session.email,
    fullName: backendResult.user?.name ?? session.fullName ?? "",
    accessToken: backendResult.access_token,
    expiresInSeconds: backendResult.expires_in_seconds,
  });

  return getCurrentSession();
};

const getAuthenticatedSession = () => {
  const session = getCurrentSession();
  if (!session?.accessToken) {
    return null;
  }
  return session;
};

export const changeCurrentPassword = async ({
  currentPassword,
  newPassword,
}) => {
  const session = getAuthenticatedSession();
  if (!session) {
    throw new Error("You must be signed in to change your password.");
  }

  const response = await fetch(
    `${API_BASE_URL}${API_ROUTES.AUTH_PASSWORD_CHANGE}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to update password."),
    );
  }

  const backendResult = await response.json();
  persistSession({
    accountType: session.accountType,
    loginId: session.loginId,
    email: session.email,
    fullName: backendResult.user?.name ?? session.fullName ?? "",
    accessToken: backendResult.access_token,
    expiresInSeconds: backendResult.expires_in_seconds,
  });

  return backendResult;
};

export const requestPasswordReset = async ({ email }) => {
  const response = await fetch(
    `${API_BASE_URL}${API_ROUTES.AUTH_PASSWORD_FORGOT}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: normalizeEmail(email) }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to request password reset."),
    );
  }

  return response.json();
};

export const confirmPasswordReset = async ({
  email,
  resetToken,
  newPassword,
  confirmNewPassword,
}) => {
  const response = await fetch(
    `${API_BASE_URL}${API_ROUTES.AUTH_PASSWORD_RESET}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: normalizeEmail(email),
        reset_token: resetToken,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to reset password."),
    );
  }

  const backendResult = await response.json();
  persistSession({
    accountType: ACCOUNT_TYPES.STAFF,
    loginId: buildStandardizedLoginId({
      accountType: ACCOUNT_TYPES.STAFF,
      email,
    }),
    email,
    fullName: backendResult.user?.name ?? "",
    accessToken: backendResult.access_token,
    expiresInSeconds: backendResult.expires_in_seconds,
  });

  return backendResult;
};

export const deleteCurrentAccount = async ({ currentPassword }) => {
  const session = getAuthenticatedSession();
  if (!session) {
    throw new Error("You must be signed in to delete your account.");
  }

  const response = await fetch(`${API_BASE_URL}${API_ROUTES.AUTH_ME}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ current_password: currentPassword }),
  });

  if (!response.ok) {
    throw new Error(
      await parseErrorMessage(response, "Failed to delete account."),
    );
  }

  clearCurrentSession();
  return response.json();
};
