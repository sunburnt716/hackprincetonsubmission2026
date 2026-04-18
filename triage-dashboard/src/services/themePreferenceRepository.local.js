export const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

const STORAGE_KEY = "kinovo.settings.themeMode.v1";

const isThemeMode = (value) =>
  value === THEME_MODES.LIGHT ||
  value === THEME_MODES.DARK ||
  value === THEME_MODES.SYSTEM;

export const getStoredThemeMode = () => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isThemeMode(value) ? value : THEME_MODES.SYSTEM;
  } catch {
    return THEME_MODES.SYSTEM;
  }
};

export const setStoredThemeMode = (mode) => {
  if (!isThemeMode(mode)) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // no-op when storage is unavailable
  }
};

export const resolveThemeMode = (mode) => {
  if (mode === THEME_MODES.LIGHT || mode === THEME_MODES.DARK) {
    return mode;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? THEME_MODES.DARK : THEME_MODES.LIGHT;
};

export const applyThemeToDocument = (resolvedMode) => {
  document.documentElement.dataset.theme = resolvedMode;
  document.documentElement.style.colorScheme = resolvedMode;
};
