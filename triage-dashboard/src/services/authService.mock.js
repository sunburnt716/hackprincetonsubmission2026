import { ACCOUNT_TYPES } from "../constants/accountTypes";
import { MOCK_API_ROUTES } from "../constants/mockApiRoutes";

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

const withTransportMeta = (payload) => ({
  ...payload,
  timestamp: new Date().toISOString(),
  transportMeta: {
    recordId: crypto.randomUUID(),
    sequenceNumber: 1,
    checksum: "pending-backend-checksum",
    ackState: "pending",
    retryCount: 0,
    essentialVitalsOnly: false,
    bufferedDuringDeadZone: false,
    backfillBatchId: null,
  },
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

  upsertRegisteredAccount(accountRecord);

  return {
    ok: true,
    endpoint,
    payload: withTransportMeta({
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

  writeJsonStorage(SESSION_KEY, {
    accountType: payload.accountType,
    loginId: standardizedLoginId,
    email: normalizeEmail(payload.email),
    fullName: accountFromRegistry?.fullName ?? "",
    signedInAt: new Date().toISOString(),
  });

  return {
    ok: true,
    endpoint,
    payload: withTransportMeta({
      ...payload,
      email: normalizeEmail(payload.email),
      loginId: standardizedLoginId,
    }),
    message: "Mock Log-in accepted. Waiting for backend integration.",
  };
};

export const hasActiveSession = () => {
  const session = readJsonStorage(SESSION_KEY, null);
  return Boolean(session?.loginId && session?.email && session?.signedInAt);
};

export const clearCurrentSession = () => {
  removeStorageKey(SESSION_KEY);
};

export const getCurrentSession = () => readJsonStorage(SESSION_KEY, null);
