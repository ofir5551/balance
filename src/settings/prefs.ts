import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'en' | 'he';
export type AppAppearance = 'light' | 'dark';

export type AppPrefs = {
  language: AppLanguage;
  appearance: AppAppearance;
};

const KEY = '@balance/prefs/v1';

export async function loadPrefs(): Promise<AppPrefs | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppPrefs>;
    const language: AppLanguage = parsed.language === 'he' ? 'he' : 'en';
    const appearance: AppAppearance =
      parsed.appearance === 'dark' ? 'dark' : 'light';
    return { language, appearance };
  } catch {
    return null;
  }
}

export async function savePrefs(prefs: AppPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
}
