import {
  getStoredThemeMode,
  setStoredThemeMode,
  THEME_MODES,
} from "./themePreferenceRepository.local";

// Backend-ready seam: this object can be replaced by an API-backed repository
// without changing providers/pages that consume it.
export const themePreferenceRepository = {
  getThemeMode: getStoredThemeMode,
  saveThemeMode: setStoredThemeMode,
};

export { THEME_MODES };
