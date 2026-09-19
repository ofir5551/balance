import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as Localization from 'expo-localization';
import { setLocale } from '../i18n';
import { darkColors, lightColors, type ThemeColors } from '../theme/colors';
import {
  loadPrefs,
  savePrefs,
  type AppAppearance,
  type AppLanguage,
  type AppPrefs,
} from './prefs';

type SettingsContextValue = {
  ready: boolean;
  language: AppLanguage;
  appearance: AppAppearance;
  colors: ThemeColors;
  setLanguage: (language: AppLanguage) => void;
  setAppearance: (appearance: AppAppearance) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function deviceDefaultLanguage(): AppLanguage {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  return code === 'he' ? 'he' : 'en';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [language, setLanguageState] = useState<AppLanguage>('en');
  const [appearance, setAppearanceState] = useState<AppAppearance>('light');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await loadPrefs();
      if (cancelled) return;
      const lang = stored?.language ?? deviceDefaultLanguage();
      const appearancePref = stored?.appearance ?? 'light';
      setLocale(lang);
      setLanguageState(lang);
      setAppearanceState(appearancePref);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: AppPrefs) => {
    try {
      await savePrefs(next);
    } catch {
      // Best-effort local persist; UI already updated.
    }
  }, []);

  const setLanguage = useCallback(
    (next: AppLanguage) => {
      setLocale(next);
      setLanguageState(next);
      void persist({ language: next, appearance });
    },
    [appearance, persist],
  );

  const setAppearance = useCallback(
    (next: AppAppearance) => {
      setAppearanceState(next);
      void persist({ language, appearance: next });
    },
    [language, persist],
  );

  const colors = appearance === 'dark' ? darkColors : lightColors;

  const value = useMemo(
    () => ({
      ready,
      language,
      appearance,
      colors,
      setLanguage,
      setAppearance,
    }),
    [ready, language, appearance, colors, setLanguage, setAppearance],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
