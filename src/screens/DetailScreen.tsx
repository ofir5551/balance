import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  I18nManager,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { deleteEntry, getEntry, listSpendEvents, recordSpend } from '../db/repository';
import type { BalanceEntry, SpendEvent } from '../models/types';
import { formatMoney } from '../components/format';
import { formatExpiryDate } from '../components/expiry';
import { isRtl, t } from '../i18n';
import type { RootStackParamList } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

function Field({
  label,
  value,
  rtl,
}: {
  label: string;
  value: string;
  rtl: boolean;
}) {
  const align = rtl ? ('right' as const) : ('left' as const);
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { textAlign: align, writingDirection: rtl ? 'rtl' : 'ltr' }]}>
        {label}
      </Text>
      <Text style={[styles.value, { textAlign: align, writingDirection: rtl ? 'rtl' : 'ltr' }]}>
        {value}
      </Text>
    </View>
  );
}

function parseMajorToCents(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '.');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function DetailScreen({ navigation, route }: Props) {
  const { entryId } = route.params;
  const rtl = isRtl() || I18nManager.isRTL;
  const [entry, setEntry] = useState<BalanceEntry | null>(null);
  const [history, setHistory] = useState<SpendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [spending, setSpending] = useState(false);

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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        entry ? (
          <Pressable
            onPress={() => navigation.navigate('EditEntry', { entryId })}
            accessibilityRole="button"
            accessibilityLabel={t('edit')}
            hitSlop={8}
            style={styles.headerBtn}
          >
            <Text style={styles.headerBtnText}>{t('edit')}</Text>
          </Pressable>
        ) : null,
    });
  }, [navigation, entry, entryId]);

  const applySpend = async (override: boolean, cents: number) => {
    setSpending(true);
    try {
      await recordSpend({
        entryId,
        amountCents: cents,
        override,
        note: note.trim() || null,
      });
      setAmount('');
      setNote('');
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'NEGATIVE_BALANCE_REQUIRES_OVERRIDE') {
        Alert.alert(t('overspendTitle'), t('overspendBody'), [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('recordOverspend'),
            onPress: () => {
              void applySpend(true, cents);
            },
          },
        ]);
      } else {
        Alert.alert(t('dbError'));
      }
    } finally {
      setSpending(false);
    }
  };

  const onSpend = () => {
    const cents = parseMajorToCents(amount);
    if (cents === null) {
      Alert.alert(t('spendInvalid'));
      return;
    }
    if (!entry) return;
    const next = entry.balanceCents - cents;
    if (next < 0) {
      Alert.alert(t('overspendTitle'), t('overspendBody'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('recordOverspend'),
          onPress: () => {
            void applySpend(true, cents);
          },
        },
      ]);
      return;
    }
    void applySpend(false, cents);
  };

  const onDelete = () => {
    Alert.alert(t('deleteConfirmTitle'), t('deleteConfirmBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteEntry(entryId);
            navigation.goBack();
          })();
        },
      },
    ]);
  };

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

  const negative = entry.balanceCents < 0;
  const accepting =
    entry.acceptingStores.length > 0
      ? entry.acceptingStores.join(', ')
      : t('none');
  const expiryDisplay = formatExpiryDate(entry.expiryAt) ?? t('none');

  return (
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      // Keep focused field (spend amount/note) + nearby Spend button above keyboard.
      bottomOffset={48}
    >
      <Text
        style={[styles.balance, negative && styles.balanceNeg, rtl && styles.textRtl]}
        accessibilityLabel={`${t('balance')} ${formatMoney(entry.balanceCents, entry.currency)}`}
      >
        {formatMoney(entry.balanceCents, entry.currency)}
      </Text>
      <Text style={[styles.merchant, rtl && styles.textRtl]}>{entry.merchant}</Text>

      <View style={styles.card}>
        <Field rtl={rtl} label={t('type')} value={t(`types.${entry.type}`)} />
        <Field rtl={rtl} label={t('currency')} value={entry.currency} />
        <Field rtl={rtl} label={t('expiry')} value={expiryDisplay} />
        <Field rtl={rtl} label={t('accepting')} value={accepting} />
        <Field rtl={rtl} label={t('codeNote')} value={entry.codeNote ?? t('none')} />
      </View>

      <View style={styles.spendCard}>
        <Text style={[styles.section, rtl && styles.textRtl]}>{t('spend')}</Text>
        <Text style={[styles.label, rtl && styles.textRtl]}>{t('spendAmount')}</Text>
        <TextInput
          style={[styles.input, rtl && styles.inputRtl]}
          value={amount}
          onChangeText={setAmount}
          placeholder={t('spendPlaceholder')}
          keyboardType="decimal-pad"
          accessibilityLabel={t('spendAmount')}
        />
        <Text style={[styles.label, rtl && styles.textRtl]}>{t('spendNote')}</Text>
        <TextInput
          style={[styles.input, rtl && styles.inputRtl]}
          value={note}
          onChangeText={setNote}
          placeholder={t('spendNotePlaceholder')}
          accessibilityLabel={t('spendNote')}
        />
        <Pressable
          style={[styles.spendBtn, spending && styles.spendDisabled]}
          disabled={spending}
          onPress={onSpend}
          accessibilityRole="button"
          accessibilityLabel={t('spend')}
        >
          {spending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.spendBtnText}>{t('spend')}</Text>
          )}
        </Pressable>
      </View>

      <Text style={[styles.section, rtl && styles.textRtl]}>{t('history')}</Text>
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

      <Pressable
        style={styles.deleteBtn}
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={t('delete')}
      >
        <Text style={styles.deleteText}>{t('delete')}</Text>
      </Pressable>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1, backgroundColor: '#f7f8fa' },
  content: { padding: 16, gap: 8, paddingBottom: 120 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  textRtl: { textAlign: 'right', writingDirection: 'rtl' },
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
  spendCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    marginBottom: 8,
  },
  field: { gap: 2 },
  label: { fontSize: 12, color: '#6b7280' },
  inputRtl: { textAlign: 'right', writingDirection: 'rtl' },
  value: { fontSize: 15, color: '#111827' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 44,
    marginBottom: 4,
  },
  section: { marginTop: 4, fontSize: 16, fontWeight: '700', color: '#111827' },
  spendBtn: {
    marginTop: 8,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  spendDisabled: { opacity: 0.5 },
  spendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  event: { backgroundColor: '#fff', borderRadius: 10, padding: 12, gap: 2 },
  eventAmount: { fontSize: 15, fontWeight: '600', color: '#111827' },
  muted: { fontSize: 13, color: '#6b7280' },
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
  deleteBtn: { marginTop: 24, alignItems: 'center', paddingVertical: 14, minHeight: 44 },
  deleteText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
});
