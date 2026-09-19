import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { isRtl, t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import type { AppAppearance, AppLanguage } from '../settings/prefs';
import type { RootStackParamList } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const LANGUAGES: AppLanguage[] = ['en', 'he'];
const APPEARANCES: AppAppearance[] = ['light', 'dark'];

export function SettingsScreen(_props: Props) {
  const { language, appearance, colors, setLanguage, setAppearance } =
    useSettings();
  const rtl = isRtl();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          padding: 16,
          gap: 20,
        },
        section: { gap: 10 },
        label: {
          fontSize: 13,
          color: colors.muted,
          textAlign: rtl ? 'right' : 'left',
          writingDirection: rtl ? 'rtl' : 'ltr',
        },
        chips: {
          flexDirection: rtl ? 'row-reverse' : 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        chip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: colors.chip,
          minHeight: 36,
          justifyContent: 'center',
        },
        chipOn: {
          backgroundColor: colors.chipOn,
        },
        chipText: { color: colors.chipText, fontSize: 14 },
        chipTextOn: { color: colors.chipOnText, fontSize: 14 },
        hint: {
          marginTop: 8,
          fontSize: 13,
          color: colors.muted,
          textAlign: rtl ? 'right' : 'left',
          writingDirection: rtl ? 'rtl' : 'ltr',
        },
      }),
    [colors, rtl],
  );

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>{t('settingsLanguage')}</Text>
        <View style={styles.chips}>
          {LANGUAGES.map((lang) => {
            const on = language === lang;
            return (
              <Pressable
                key={lang}
                onPress={() => setLanguage(lang)}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t(lang === 'en' ? 'langEn' : 'langHe')}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {t(lang === 'en' ? 'langEn' : 'langHe')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('settingsAppearance')}</Text>
        <View style={styles.chips}>
          {APPEARANCES.map((mode) => {
            const on = appearance === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => setAppearance(mode)}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t(
                  mode === 'light' ? 'appearanceLight' : 'appearanceDark',
                )}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {t(mode === 'light' ? 'appearanceLight' : 'appearanceDark')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.hint}>{t('settingsSavedHint')}</Text>
    </View>
  );
}
