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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listEntries } from '../db/repository';
import type { BalanceEntry } from '../models/types';
import { formatMoney } from '../components/format';
import { expiryStatus, formatExpiryDate } from '../components/expiry';
import { isRtl, t } from '../i18n';
import type { RootStackParamList } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const FAB_SIZE = 56;
const FAB_MARGIN = 16;

export function HomeScreen({ navigation }: Props) {
  const [entries, setEntries] = useState<BalanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rtl = isRtl() || I18nManager.isRTL;
  const insets = useSafeAreaInsets();

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

  // FAB is the sole create CTA — clear any header Add.
  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: undefined });
  }, [navigation]);

  const openCreate = useCallback(() => {
    navigation.navigate('EditEntry', {});
  }, [navigation]);

  const fabStyle = [
    styles.fab,
    {
      bottom: FAB_MARGIN + insets.bottom,
      ...(rtl
        ? { left: FAB_MARGIN + insets.left }
        : { right: FAB_MARGIN + insets.right }),
    },
  ];

  const fab = (
    <Pressable
      style={({ pressed }) => [fabStyle, pressed && styles.fabPressed]}
      onPress={openCreate}
      accessibilityRole="button"
      accessibilityLabel={t('addEntry')}
    >
      <Text style={styles.fabPlus} accessible={false}>
        +
      </Text>
    </Pressable>
  );

  if (loading && entries.length === 0 && !error) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator />
          <Text style={styles.muted}>{t('loading')}</Text>
        </View>
        {fab}
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

  const listBottomPad = FAB_SIZE + FAB_MARGIN * 2 + insets.bottom;

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[
          entries.length === 0 ? styles.centered : styles.content,
          { paddingBottom: listBottomPad },
        ]}
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
                    {t('expiresOn', { date: expiryLabel })}
                  </Text>
                ) : null}
                {expired ? <Text style={styles.expiredCue}>{t('expired')}</Text> : null}
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
      {fab}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
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
  fab: {
    position: 'absolute',
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    // Soft shadow (iOS + Android)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: { opacity: 0.9 },
  fabPlus: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 36,
    marginTop: -2,
  },
});
