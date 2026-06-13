import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_GAME_THEME_ID,
  GAME_THEMES,
  isGameThemeId,
  type GameTheme,
  type GameThemeId,
} from "#/lib/gameTheme.ts";

const GAME_THEME_STORAGE_KEY = "card-party.theme:v1";

interface GameThemeContextValue {
  theme: GameTheme;
  themeId: GameThemeId;
  setThemeId: (themeId: GameThemeId) => void;
}

const GameThemeContext = createContext<GameThemeContextValue | null>(null);

function applyThemeToDocument(theme: GameTheme) {
  document.documentElement.dataset.gameTheme = theme.id;
  document.title = theme.pageTitle;

  const metaContent = [
    ['meta[name="description"]', theme.description],
    ['meta[name="application-name"]', theme.name],
    ['meta[name="apple-mobile-web-app-title"]', theme.name],
    ['meta[property="og:site_name"]', theme.name],
    ['meta[property="og:title"]', theme.pageTitle],
    ['meta[property="og:description"]', theme.description],
    ['meta[name="twitter:title"]', theme.pageTitle],
    ['meta[name="twitter:description"]', theme.description],
  ] as const;

  for (const [selector, content] of metaContent) {
    const element = document.querySelector<HTMLMetaElement>(selector);
    if (element) element.content = content;
  }
}

export function GameThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<GameThemeId>(DEFAULT_GAME_THEME_ID);
  const theme = GAME_THEMES[themeId];

  useEffect(() => {
    try {
      const storedThemeId = localStorage.getItem(GAME_THEME_STORAGE_KEY);
      if (isGameThemeId(storedThemeId)) setThemeIdState(storedThemeId);
    } catch {
      // Storage can be unavailable in private browsing or hardened browsers.
    }
  }, []);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event: StorageEvent) => {
      if (event.key === GAME_THEME_STORAGE_KEY && isGameThemeId(event.newValue)) {
        setThemeIdState(event.newValue);
      }
    };
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  const value = useMemo<GameThemeContextValue>(
    () => ({
      theme,
      themeId,
      setThemeId: (nextThemeId) => {
        setThemeIdState(nextThemeId);
        try {
          localStorage.setItem(GAME_THEME_STORAGE_KEY, nextThemeId);
        } catch {
          // The in-memory selection still works when storage is unavailable.
        }
      },
    }),
    [theme, themeId],
  );

  return <GameThemeContext.Provider value={value}>{children}</GameThemeContext.Provider>;
}

export function useGameTheme(): GameThemeContextValue {
  const context = useContext(GameThemeContext);
  if (!context) throw new Error("useGameTheme must be used within GameThemeProvider");
  return context;
}
