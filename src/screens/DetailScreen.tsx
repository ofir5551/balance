import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getEntry, listSpendEvents } from '../db/repository';
import type { BalanceEntry, SpendEvent } from '../models/types';
import { formatMoney } from '../components/format';
import { t } from '../i18n';
import type { RootStackParamList } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function DetailScreen({ route }: Props) {
  const { entryId } = route.params;
  const [entry, setEntry] = useState<BalanceEntry | null>(null);
  const [history, setHistory] = useState<SpendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [e, events] = await Promise.all([
        getEntry(entryId),
        listSpendEvents(entryId),
      ]);
      setEntry(e);
      setHistory(events);
      if (!e) setError(t('dbError'));
    } catch {
      setError(t('dbError'));
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  if (loading && !entry) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.muted}>{t('loading')}</Text>
      </View>
    );
  }

  if (error || !entry) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? t('dbError')}</Text>
      </View>
    );
  }

  const negative = entry.balanceCents < 0;
  const accepting =
    entry.acceptingStores.length > 0
      ? entry.acceptingStores.join(', ')
      : t('none');

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text
        style={[styles.balance, negative && styles.balanceNeg]}
        accessibilityLabel={`${t('balance')} ${formatMoney(entry.balanceCents, entry.currency)}`}
      >
        {formatMoney(entry.balanceCents, entry.currency)}
      </Text>
      <Text style={styles.merchant}>{entry.merchant}</Text>

      <View style={styles.card}>
        <Field label={t('type')} value={t(`types.${entry.type}`)} />
        <Field label={t('currency')} value={entry.currency} />
        <Field label={t('expiry')} value={entry.expiryAt ?? t('none')} />
        <Field label={t('accepting')} value={accepting} />
        <Field label={t('codeNote')} value={entry.codeNote ?? t('none')} />
      </View>

      <Text style={styles.section}>{t('history')}</Text>
      {history.length === 0 ? (
        <Text style={styles.muted}>{t('noHistory')}</Text>
      ) : (
        history.map((ev) => (
          <View key={ev.id} style={styles.event}>
            <Text style={styles.eventAmount}>
              −{formatMoney(ev.amountCents, entry.currency)}
              {ev.override ? ` · ${t('override')}` : ''}
            </Text>
            <Text style={styles.muted}>
              {new Date(ev.createdAt).toLocaleString()}
              {ev.note ? ` · ${ev.note}` : ''}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f7f8fa' },
  content: { padding: 16, gap: 8 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  balance: { fontSize: 32, fontWeight: '700', color: '#111827' },
  balanceNeg: { color: '#dc2626' },
  merchant: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  field: { gap: 2 },
  label: { fontSize: 12, color: '#6b7280', textTransform: 'uppercase' },
  value: { fontSize: 15, color: '#111827' },
  section: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  event: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    gap: 2,
  },
  eventAmount: { fontSize: 15, fontWeight: '600', color: '#111827' },
  muted: { fontSize: 13, color: '#6b7280' },
  error: { fontSize: 15, color: '#dc2626', textAlign: 'center' },
});
