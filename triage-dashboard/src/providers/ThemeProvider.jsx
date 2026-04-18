import { useEffect, useMemo, useState } from "react";
import { ThemeContext } from "./themeContext";
import {
  applyThemeToDocument,
  resolveThemeMode,
  THEME_MODES,
} from "../services/themePreferenceRepository.local";
import { themePreferenceRepository } from "../services/themePreferenceRepository";

function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() =>
    themePreferenceRepository.getThemeMode(),
  );
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    resolveThemeMode(themePreferenceRepository.getThemeMode()),
  );

  useEffect(() => {
    const nextResolvedTheme = resolveThemeMode(themeMode);
    setResolvedTheme(nextResolvedTheme);
    applyThemeToDocument(nextResolvedTheme);
    themePreferenceRepository.saveThemeMode(themeMode);

    if (themeMode !== THEME_MODES.SYSTEM) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => {
      const mode = event.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT;
      setResolvedTheme(mode);
      applyThemeToDocument(mode);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      setThemeMode,
      themeModes: THEME_MODES,
    }),
    [themeMode, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export default ThemeProvider;
