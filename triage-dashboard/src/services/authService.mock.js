import { ACCOUNT_TYPES } from "../constants/accountTypes";
import { MOCK_API_ROUTES } from "../constants/mockApiRoutes";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://127.0.0.1:8000";

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const REGISTERED_ACCOUNTS_KEY = "kinovo.registeredAccounts.v1";
const SESSION_KEY = "kinovo.session.v1";

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
    // No-op in environments with restricted storage access.
  }
};

const removeStorageKey = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // No-op in environments with restricted storage access.
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

export const getRegisteredAccounts = () =>
  readJsonStorage(REGISTERED_ACCOUNTS_KEY, []);

const upsertRegisteredAccount = (account) => {
  const accounts = getRegisteredAccounts();
  const existingIndex = accounts.findIndex(
    (entry) => entry.loginId === account.loginId,
  );

  if (existingIndex >= 0) {
    accounts[existingIndex] = { ...accounts[existingIndex], ...account };
  } else {
    accounts.push(account);
  }

  writeJsonStorage(REGISTERED_ACCOUNTS_KEY, accounts);
  return account;
};

export const findRegisteredAccountByEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  return getRegisteredAccounts().find(
    (entry) => normalizeEmail(entry.email) === normalizedEmail,
  );
};

export const createTemporaryPatientAccount = ({
  fullName,
  email,
  createdByLoginId,
}) => {
  const normalizedEmail = normalizeEmail(email);
  const account = {
    accountType: ACCOUNT_TYPES.PATIENT,
    fullName: fullName.trim(),
    email: normalizedEmail,
    loginId: buildStandardizedLoginId({
      accountType: ACCOUNT_TYPES.PATIENT,
      email: normalizedEmail,
    }),
    temporary: true,
    createdByLoginId,
    createdAt: new Date().toISOString(),
    status: "pending-registration",
  };

  return upsertRegisteredAccount(account);
};

export const buildStandardizedLoginId = ({ accountType, email }) => {
  const normalizedEmail = normalizeEmail(email);
  return `${accountType}:${normalizedEmail}`;
};

const resolveAuthRoute = (accountType, action) => {
  if (accountType === ACCOUNT_TYPES.STAFF) {
    return action === "signup"
      ? MOCK_API_ROUTES.STAFF_SIGNUP
      : MOCK_API_ROUTES.STAFF_LOGIN;
  }

  return action === "signup"
    ? MOCK_API_ROUTES.PATIENT_SIGNUP
    : MOCK_API_ROUTES.PATIENT_LOGIN;
};

const withRequestMeta = (payload) => ({
  ...payload,
  timestamp: new Date().toISOString(),
});

export const submitSignup = async (payload) => {
  const endpoint = resolveAuthRoute(payload.accountType, "signup");
  const standardizedLoginId = buildStandardizedLoginId({
    accountType: payload.accountType,
    email: payload.email,
  });

  const accountRecord = {
    accountType: payload.accountType,
    fullName: payload.fullName,
    email: normalizeEmail(payload.email),
    loginId: standardizedLoginId,
    profile: payload.profile ?? {},
    temporary: false,
    status: "active",
    updatedAt: new Date().toISOString(),
  };

  if (payload.accountType === ACCOUNT_TYPES.STAFF) {
    const backendPayload = {
      email: normalizeEmail(payload.email),
      password: payload.password,
      name: payload.fullName,
      age: payload.profile?.age ? Number(payload.profile.age) : null,
      hospital: payload.profile?.hospitalName ?? "Not set",
      position: payload.profile?.staffRole ?? "Not set",
    };

    const response = await fetch(
      `${API_BASE_URL}${MOCK_API_ROUTES.STAFF_SIGNUP}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backendPayload),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(details || "Failed to create staff account.");
    }

    const backendResult = await response.json();

    const persistedAccount = upsertRegisteredAccount({
      ...accountRecord,
      fullName: backendResult.user?.name ?? accountRecord.fullName,
      profile: {
        ...accountRecord.profile,
        hospitalName:
          backendResult.user?.hospital ?? accountRecord.profile.hospitalName,
        staffRole:
          backendResult.user?.position ?? accountRecord.profile.staffRole,
      },
    });

    persistSession({
      accountType: payload.accountType,
      loginId: standardizedLoginId,
      email: payload.email,
      fullName: persistedAccount.fullName,
      accessToken: backendResult.access_token,
      expiresInSeconds: backendResult.expires_in_seconds,
    });

    return {
      ok: true,
      endpoint,
      payload: withRequestMeta({
        ...payload,
        email: normalizeEmail(payload.email),
        loginId: standardizedLoginId,
      }),
      message:
        backendResult.message || "Staff account created via backend route.",
    };
  }

  const persistedAccount = upsertRegisteredAccount(accountRecord);

  persistSession({
    accountType: payload.accountType,
    loginId: standardizedLoginId,
    email: payload.email,
    fullName: persistedAccount.fullName,
  });

  return {
    ok: true,
    endpoint,
    payload: withRequestMeta({
      ...payload,
      email: normalizeEmail(payload.email),
      loginId: standardizedLoginId,
    }),
    message: "Mock Sign-up accepted. Waiting for backend integration.",
  };
};

export const submitLogin = async (payload) => {
  const endpoint = resolveAuthRoute(payload.accountType, "login");
  const standardizedLoginId = buildStandardizedLoginId({
    accountType: payload.accountType,
    email: payload.email,
  });

  const accountFromRegistry = findRegisteredAccountByEmail(payload.email);

  if (payload.accountType === ACCOUNT_TYPES.STAFF) {
    const response = await fetch(
      `${API_BASE_URL}${MOCK_API_ROUTES.STAFF_LOGIN}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizeEmail(payload.email),
          password: payload.password,
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(details || "Failed to sign in.");
    }

    const backendResult = await response.json();

    persistSession({
      accountType: payload.accountType,
      loginId: standardizedLoginId,
      email: payload.email,
      fullName: backendResult.user?.name ?? accountFromRegistry?.fullName ?? "",
      accessToken: backendResult.access_token,
      expiresInSeconds: backendResult.expires_in_seconds,
    });

    return {
      ok: true,
      endpoint,
      payload: withRequestMeta({
        ...payload,
        email: normalizeEmail(payload.email),
        loginId: standardizedLoginId,
      }),
      message: backendResult.message || "Staff sign-in successful.",
    };
  }

  persistSession({
    accountType: payload.accountType,
    loginId: standardizedLoginId,
    email: payload.email,
    fullName: accountFromRegistry?.fullName ?? "",
  });

  return {
    ok: true,
    endpoint,
    payload: withRequestMeta({
      ...payload,
      email: normalizeEmail(payload.email),
      loginId: standardizedLoginId,
    }),
    message: "Mock Log-in accepted. Waiting for backend integration.",
  };
};

export const hasActiveSession = () => {
  const session = readJsonStorage(SESSION_KEY, null);
  if (!session?.loginId || !session?.email || !session?.signedInAt) {
    return false;
  }

  if (session.expiresAt && Date.now() > session.expiresAt) {
    clearCurrentSession();
    return false;
  }

  return true;
};

export const clearCurrentSession = () => {
  removeStorageKey(SESSION_KEY);
};

export const getCurrentSession = () => readJsonStorage(SESSION_KEY, null);

export const refreshCurrentSession = async () => {
  const session = getCurrentSession();

  if (!session?.accessToken) {
    return null;
  }

  const response = await fetch(
    `${API_BASE_URL}${MOCK_API_ROUTES.AUTH_SESSION_REFRESH}`,
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
    `${API_BASE_URL}${MOCK_API_ROUTES.AUTH_PASSWORD_CHANGE}`,
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
    const details = await response.text();
    throw new Error(details || "Failed to update password.");
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
    `${API_BASE_URL}${MOCK_API_ROUTES.AUTH_PASSWORD_FORGOT}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: normalizeEmail(email) }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || "Failed to request password reset.");
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
    `${API_BASE_URL}${MOCK_API_ROUTES.AUTH_PASSWORD_RESET}`,
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
    const details = await response.text();
    throw new Error(details || "Failed to reset password.");
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

  const response = await fetch(`${API_BASE_URL}${MOCK_API_ROUTES.AUTH_ME}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({ current_password: currentPassword }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || "Failed to delete account.");
  }

  clearCurrentSession();
  return response.json();
};
