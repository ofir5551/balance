import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  I18nManager,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { listEntries } from '../db/repository';
import type { BalanceEntry } from '../models/types';
import { formatMoney } from '../components/format';
import { expiryStatus, formatExpiryDate } from '../components/expiry';
import { isRtl, t } from '../i18n';
import type { RootStackParamList } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [entries, setEntries] = useState<BalanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rtl = isRtl() || I18nManager.isRTL;

  const load = useCallback(async () => {
    setError(null);
    try {
      const rows = await listEntries();
      setEntries(rows);
    } catch {
      setError(t('dbError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('EditEntry', {})}
          accessibilityRole="button"
          accessibilityLabel={t('add')}
          hitSlop={8}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBtnText}>{t('add')}</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  if (loading && entries.length === 0 && !error) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.muted}>{t('loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Pressable
          style={styles.retry}
          onPress={() => {
            setLoading(true);
            void load();
          }}
          accessibilityRole="button"
          accessibilityLabel={t('retry')}
        >
          <Text style={styles.retryText}>{t('retry')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={entries.length === 0 ? styles.centered : styles.content}
      data={entries}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.empty}>{t('empty')}</Text>
          <Text style={styles.muted}>{t('emptyHint')}</Text>
        </View>
      }
      renderItem={({ item }) => {
        const negative = item.balanceCents < 0;
        const status = expiryStatus(item.expiryAt);
        const expired = status === 'expired';
        const soon = status === 'soon';
        const expiryLabel = formatExpiryDate(item.expiryAt);
        const a11y = `${item.merchant}, ${formatMoney(item.balanceCents, item.currency)}`;

        return (
          <Pressable
            style={[styles.row, rtl && styles.rowRtl, expired && styles.rowMuted]}
            onPress={() => navigation.navigate('Detail', { entryId: item.id })}
            accessibilityRole="button"
            accessibilityLabel={a11y}
          >
            <View style={styles.rowText}>
              <Text style={[styles.merchant, expired && styles.mutedText]} numberOfLines={1}>
                {item.merchant}
              </Text>
              <Text style={[styles.meta, expired && styles.mutedText]}>
                {t(`types.${item.type}`)}
              </Text>
              {soon && expiryLabel ? (
                <Text style={styles.soonCue}>
                  {t('soonExpiring')} · {expiryLabel}
                </Text>
              ) : null}
              {expired && expiryLabel ? (
                <Text style={styles.expiredCue}>
                  {t('expired')} · {expiryLabel}
                </Text>
              ) : null}
            </View>
            <Text
              style={[
                styles.balance,
                negative && styles.balanceNeg,
                expired && styles.mutedText,
              ]}
            >
              {formatMoney(item.balanceCents, item.currency)}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f7f8fa' },
  content: { paddingVertical: 8 },
  centered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    minHeight: 56,
  },
  rowRtl: { flexDirection: 'row-reverse' },
  rowMuted: { opacity: 0.55 },
  rowText: { flex: 1, gap: 2 },
  merchant: { fontSize: 16, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 13, color: '#6b7280' },
  soonCue: { fontSize: 12, color: '#b45309', marginTop: 2 },
  expiredCue: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  balance: { fontSize: 16, fontWeight: '700', color: '#111827' },
  balanceNeg: { color: '#dc2626' },
  mutedText: { color: '#9ca3af' },
  empty: { fontSize: 18, fontWeight: '600', color: '#111827' },
  muted: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  error: { fontSize: 15, color: '#dc2626', textAlign: 'center' },
  retry: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#111827',
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  headerBtn: { paddingHorizontal: 8, minHeight: 44, justifyContent: 'center' },
  headerBtnText: { color: '#2563eb', fontSize: 16, fontWeight: '600' },
});
