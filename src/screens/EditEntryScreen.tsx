import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  I18nManager,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createEntry, getEntry, updateEntry } from '../db/repository';
import type { BalanceEntryType } from '../models/types';
import { isRtl, t } from '../i18n';
import type { RootStackParamList } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditEntry'>;

const TYPES: BalanceEntryType[] = [
  'gift_card',
  'store_credit',
  'voucher',
  'other',
];

function parseMajorToCents(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '.');
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function EditEntryScreen({ navigation, route }: Props) {
  const entryId = route.params?.entryId;
  const rtl = isRtl() || I18nManager.isRTL;
  const isEdit = Boolean(entryId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<BalanceEntryType>('gift_card');
  const [merchant, setMerchant] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('ILS');
  const [expiry, setExpiry] = useState('');
  const [stores, setStores] = useState<string[]>([]);
  const [storeDraft, setStoreDraft] = useState('');
  const [codeNote, setCodeNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? t('editTitle') : t('createTitle') });
  }, [navigation, isEdit]);

  useEffect(() => {
    if (!entryId) return;
    void (async () => {
      try {
        const e = await getEntry(entryId);
        if (!e) {
          setError(t('dbError'));
          return;
        }
        setType(e.type);
        setMerchant(e.merchant);
        setBalance((e.balanceCents / 100).toFixed(2));
        setCurrency(e.currency);
        setExpiry(e.expiryAt ?? '');
        setStores(e.acceptingStores);
        setCodeNote(e.codeNote ?? '');
      } catch {
        setError(t('dbError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [entryId]);

  const addStore = () => {
    const v = storeDraft.trim();
    if (!v) return;
    if (!stores.includes(v)) setStores((s) => [...s, v]);
    setStoreDraft('');
  };

  const canSave =
    merchant.trim().length > 0 &&
    parseMajorToCents(balance) !== null &&
    currency.trim().length === 3;

  const onSave = useCallback(async () => {
    const cents = parseMajorToCents(balance);
    if (!merchant.trim() || cents === null || currency.trim().length !== 3) {
      setError(t('required'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        type,
        merchant: merchant.trim(),
        acceptingStores: stores,
        balanceCents: cents,
        currency: currency.trim().toUpperCase(),
        expiryAt: expiry.trim() || null,
        codeNote: codeNote.trim() || null,
      };
      if (isEdit && entryId) {
        await updateEntry(entryId, payload);
        navigation.goBack();
      } else {
        const created = await createEntry(payload);
        navigation.replace('Detail', { entryId: created.id });
      }
    } catch {
      setError(t('dbError'));
    } finally {
      setSaving(false);
    }
  }, [
    balance,
    codeNote,
    currency,
    entryId,
    expiry,
    isEdit,
    merchant,
    navigation,
    stores,
    type,
  ]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <Text style={[styles.label, rtl && styles.textRtl]}>{t('type')}</Text>
        <View style={[styles.chips, rtl && styles.chipsRtl]}>
          {TYPES.map((tp) => (
            <Pressable
              key={tp}
              onPress={() => setType(tp)}
              style={[styles.chip, type === tp && styles.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: type === tp }}
            >
              <Text style={[styles.chipText, type === tp && styles.chipTextOn]}>
                {t(`types.${tp}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, rtl && styles.textRtl]}>{t('merchant')} *</Text>
        <TextInput
          style={[styles.input, rtl && styles.inputRtl]}
          value={merchant}
          onChangeText={setMerchant}
          placeholder={t('merchantPlaceholder')}
          autoCapitalize="words"
        />

        <Text style={[styles.label, rtl && styles.textRtl]}>{t('balance')} *</Text>
        <TextInput
          style={[styles.input, rtl && styles.inputRtl]}
          value={balance}
          onChangeText={setBalance}
          placeholder={t('balancePlaceholder')}
          keyboardType="decimal-pad"
        />

        <Text style={[styles.label, rtl && styles.textRtl]}>{t('currency')} *</Text>
        <TextInput
          style={[styles.input, rtl && styles.inputRtl]}
          value={currency}
          onChangeText={setCurrency}
          autoCapitalize="characters"
          maxLength={3}
        />

        <Text style={[styles.label, rtl && styles.textRtl]}>{t('expiry')}</Text>
        <TextInput
          style={[styles.input, rtl && styles.inputRtl]}
          value={expiry}
          onChangeText={setExpiry}
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
        />

        <Text style={[styles.label, rtl && styles.textRtl]}>{t('accepting')}</Text>
        <View style={[styles.chips, rtl && styles.chipsRtl]}>
          {stores.map((s) => (
            <Pressable
              key={s}
              onPress={() => setStores((prev) => prev.filter((x) => x !== s))}
              style={styles.chipOn}
              accessibilityRole="button"
              accessibilityLabel={`${t('delete')} ${s}`}
            >
              <Text style={styles.chipTextOn}>{s} ×</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.row, rtl && styles.rowRtl]}>
          <TextInput
            style={[styles.input, styles.flex, rtl && styles.inputRtl]}
            value={storeDraft}
            onChangeText={setStoreDraft}
            placeholder={t('acceptingPlaceholder')}
            onSubmitEditing={addStore}
          />
          <Pressable style={styles.addStore} onPress={addStore}>
            <Text style={styles.addStoreText}>+</Text>
          </Pressable>
        </View>

        <Text style={[styles.label, rtl && styles.textRtl]}>{t('codeNote')}</Text>
        <TextInput
          style={[styles.input, styles.multiline, rtl && styles.inputRtl]}
          value={codeNote}
          onChangeText={setCodeNote}
          placeholder={t('codeNotePlaceholder')}
          multiline
        />

        {error ? <Text style={[styles.error, rtl && styles.textRtl]}>{error}</Text> : null}

        <Pressable
          style={[styles.save, (!canSave || saving) && styles.saveDisabled]}
          disabled={!canSave || saving}
          onPress={() => void onSave()}
          accessibilityRole="button"
          accessibilityLabel={t('save')}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>{t('save')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 120 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, color: '#6b7280', marginTop: 8 },
  textRtl: { textAlign: 'right', writingDirection: 'rtl' },
  inputRtl: { textAlign: 'right', writingDirection: 'rtl' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 44,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipsRtl: { flexDirection: 'row-reverse' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    minHeight: 36,
    justifyContent: 'center',
  },
  chipOn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#111827',
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: { color: '#374151', fontSize: 14 },
  chipTextOn: { color: '#fff', fontSize: 14 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rowRtl: { flexDirection: 'row-reverse' },
  addStore: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStoreText: { color: '#fff', fontSize: 22, fontWeight: '600' },
  save: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  error: { color: '#dc2626', marginTop: 8 },
});
