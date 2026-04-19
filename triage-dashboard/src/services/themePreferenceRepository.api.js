import { API_ROUTES } from "../constants/apiRoutes";

// Placeholder for later backend persistence.
// Intentionally not used yet; local repository remains active for prototype speed.
export const themePreferenceApiRepository = {
  async getThemeMode() {
    throw new Error(
      `Theme settings API not wired yet. Expected endpoint: ${API_ROUTES.DASHBOARD_SETTINGS}`,
    );
  },
  async saveThemeMode() {
    throw new Error(
      `Theme settings API not wired yet. Expected endpoint: ${API_ROUTES.DASHBOARD_SETTINGS}`,
    );
  },
};
