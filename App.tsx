import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import { pingDatabase } from './src/db/client';

const i18n = new I18n({
  en: {
    title: 'Balance',
    subtitle: 'Personal gift-card & store-credit tracker (offline-first)',
    dbLoading: 'Opening SQLite…',
    dbOk: 'SQLite opened successfully',
    dbError: 'SQLite failed to open',
  },
  he: {
    title: 'Balance',
    subtitle: 'מעקב אישי אחרי כרטיסי מתנה וזיכוי חנות (אופליין)',
    dbLoading: 'פותח SQLite…',
    dbOk: 'SQLite נפתח בהצלחה',
    dbError: 'פתיחת SQLite נכשלה',
  },
});
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

type DbStatus = 'loading' | 'ok' | 'error';

export default function App() {
  const [dbStatus, setDbStatus] = useState<DbStatus>('loading');

  const locale = useMemo(() => {
    const code = Localization.getLocales()[0]?.languageCode ?? 'en';
    return code === 'he' ? 'he' : code;
  }, []);
  i18n.locale = locale;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ok = await pingDatabase();
        if (!cancelled) setDbStatus(ok ? 'ok' : 'error');
      } catch {
        if (!cancelled) setDbStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusLabel =
    dbStatus === 'loading'
      ? i18n.t('dbLoading')
      : dbStatus === 'ok'
        ? i18n.t('dbOk')
        : i18n.t('dbError');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('title')}</Text>
      <Text style={styles.subtitle}>{i18n.t('subtitle')}</Text>
      <View style={styles.statusRow}>
        {dbStatus === 'loading' ? (
          <ActivityIndicator accessibilityLabel={i18n.t('dbLoading')} />
        ) : null}
        <Text
          style={[
            styles.status,
            dbStatus === 'ok' && styles.statusOk,
            dbStatus === 'error' && styles.statusError,
          ]}
        >
          {statusLabel}
        </Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f8fa',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  status: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusOk: {
    color: '#059669',
    fontWeight: '600',
  },
  statusError: {
    color: '#dc2626',
    fontWeight: '600',
  },
});
