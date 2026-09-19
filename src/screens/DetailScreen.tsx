import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { deleteEntry, getEntry, listSpendEvents, recordSpend } from '../db/repository';
import type { BalanceEntry, SpendEvent } from '../models/types';
import { formatMoney } from '../components/format';
import { formatExpiryDate } from '../components/expiry';
import { isRtl, t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import type { ThemeColors } from '../theme/colors';
import type { RootStackParamList } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

function Field({
  label,
  value,
  rtl,
  colors,
}: {
  label: string;
  value: string;
  rtl: boolean;
  colors: ThemeColors;
}) {
  const align = rtl ? ('right' as const) : ('left' as const);
  return (
    <View style={{ gap: 2 }}>
      <Text
        style={{
          fontSize: 12,
          color: colors.muted,
          textAlign: align,
          writingDirection: rtl ? 'rtl' : 'ltr',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: colors.text,
          textAlign: align,
          writingDirection: rtl ? 'rtl' : 'ltr',
        }}
      >
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
  const rtl = isRtl();
  const { colors, language } = useSettings();
  const [entry, setEntry] = useState<BalanceEntry | null>(null);
  const [history, setHistory] = useState<SpendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [spending, setSpending] = useState(false);
  const [inputFocus, setInputFocus] = useState<'amount' | 'note' | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: { flex: 1, backgroundColor: colors.background },
        content: { padding: 16, gap: 8, paddingBottom: 120 },
        centered: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 8,
          backgroundColor: colors.background,
        },
        textRtl: { textAlign: 'right', writingDirection: 'rtl' },
        balance: { fontSize: 32, fontWeight: '700', color: colors.text },
        balanceNeg: { color: colors.danger },
        merchant: {
          fontSize: 18,
          fontWeight: '600',
          color: colors.textSecondary,
          marginBottom: 8,
        },
        card: {
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 14,
          gap: 10,
          marginBottom: 8,
        },
        spendCard: {
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 14,
          gap: 6,
          marginBottom: 8,
        },
        label: { fontSize: 12, color: colors.muted },
        inputRtl: { textAlign: 'right', writingDirection: 'rtl' },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.inputBg,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 12,
          fontSize: 16,
          minHeight: 44,
          marginBottom: 4,
          color: colors.text,
        },
        inputFocused: {
          borderColor: colors.primary,
        },
        section: {
          marginTop: 4,
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
        },
        spendBtn: {
          marginTop: 8,
          backgroundColor: colors.primary,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          minHeight: 48,
          justifyContent: 'center',
        },
        spendDisabled: { opacity: 0.5 },
        spendBtnText: {
          color: colors.primaryText,
          fontSize: 16,
          fontWeight: '700',
        },
        event: {
          backgroundColor: colors.card,
          borderRadius: 10,
          padding: 12,
          gap: 2,
        },
        eventAmount: { fontSize: 15, fontWeight: '600', color: colors.text },
        muted: { fontSize: 13, color: colors.muted },
        error: { fontSize: 15, color: colors.danger, textAlign: 'center' },
        retry: {
          marginTop: 8,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 8,
          backgroundColor: colors.primary,
          minHeight: 44,
          justifyContent: 'center',
        },
        retryText: {
          color: colors.primaryText,
          fontWeight: '600',
          fontSize: 15,
        },
        headerBtn: {
          paddingHorizontal: 8,
          minHeight: 44,
          justifyContent: 'center',
        },
        headerBtnText: {
          color: colors.link,
          fontSize: 16,
          fontWeight: '600',
        },
        deleteBtn: {
          marginTop: 24,
          alignItems: 'center',
          paddingVertical: 14,
          minHeight: 44,
        },
        deleteText: {
          color: colors.danger,
          fontSize: 16,
          fontWeight: '600',
        },
      }),
    [colors],
  );

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
      title: t('detail'),
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
  }, [navigation, entry, entryId, styles.headerBtn, styles.headerBtnText, language]);

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
        <ActivityIndicator color={colors.text} />
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
        <Field rtl={rtl} colors={colors} label={t('type')} value={t(`types.${entry.type}`)} />
        <Field rtl={rtl} colors={colors} label={t('currency')} value={entry.currency} />
        <Field rtl={rtl} colors={colors} label={t('expiry')} value={expiryDisplay} />
        <Field rtl={rtl} colors={colors} label={t('accepting')} value={accepting} />
        <Field
          rtl={rtl}
          colors={colors}
          label={t('codeNote')}
          value={entry.codeNote ?? t('none')}
        />
      </View>

      <View style={styles.spendCard}>
        <Text style={[styles.section, rtl && styles.textRtl]}>{t('spendSection')}</Text>
        <Text style={[styles.label, rtl && styles.textRtl]}>{t('spendAmount')}</Text>
        <TextInput
          style={[
            styles.input,
            rtl && styles.inputRtl,
            inputFocus === 'amount' && styles.inputFocused,
          ]}
          value={amount}
          onChangeText={setAmount}
          placeholder={t('spendPlaceholder')}
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          accessibilityLabel={t('spendAmount')}
          onFocus={() => setInputFocus('amount')}
          onBlur={() => setInputFocus((f) => (f === 'amount' ? null : f))}
        />
        <Text style={[styles.label, rtl && styles.textRtl]}>{t('spendNote')}</Text>
        <TextInput
          style={[
            styles.input,
            rtl && styles.inputRtl,
            inputFocus === 'note' && styles.inputFocused,
          ]}
          value={note}
          onChangeText={setNote}
          placeholder={t('spendNotePlaceholder')}
          placeholderTextColor={colors.muted}
          accessibilityLabel={t('spendNote')}
          onFocus={() => setInputFocus('note')}
          onBlur={() => setInputFocus((f) => (f === 'note' ? null : f))}
        />
        <Pressable
          style={[styles.spendBtn, spending && styles.spendDisabled]}
          disabled={spending}
          onPress={onSpend}
          accessibilityRole="button"
          accessibilityLabel={t('spend')}
        >
          {spending ? (
            <ActivityIndicator color={colors.primaryText} />
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
