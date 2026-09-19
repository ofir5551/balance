import { useCallback, useEffect, useMemo, useState } from 'react';
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
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatExpiryDate } from '../components/expiry';
import {
  EXPIRY_PRESETS,
  matchingPresetId,
  parseIsoDateLocal,
  presetExpiryIso,
  toIsoDateLocal,
  type ExpiryPresetId,
} from '../components/expiryPresets';
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
  /** YYYY-MM-DD or null */
  const [expiry, setExpiry] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDraft, setPickerDraft] = useState<Date>(() => new Date());
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
        setExpiry(e.expiryAt ?? null);
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

  const selectedPreset = useMemo(() => matchingPresetId(expiry), [expiry]);

  const expiryResultText = formatExpiryDate(expiry) ?? t('none');
  const expiryA11yLabel = `${t('expiry')}: ${expiryResultText}`;

  const onPresetPress = (id: ExpiryPresetId) => {
    setShowPicker(false);
    if (id === 'none') {
      setExpiry(null);
      return;
    }
    setExpiry(presetExpiryIso(id));
  };

  const openPicker = () => {
    setPickerDraft(expiry ? (parseIsoDateLocal(expiry) ?? new Date()) : new Date());
    setShowPicker(true);
  };

  const confirmPicker = (date: Date) => {
    setExpiry(toIsoDateLocal(date));
    setShowPicker(false);
  };

  const onPickerValueChange = (_event: DateTimePickerChangeEvent, date: Date) => {
    if (Platform.OS === 'android') {
      confirmPicker(date);
      return;
    }
    // iOS: spin updates draft; confirm via Done
    setPickerDraft(date);
  };

  const onPickerDismiss = () => {
    setShowPicker(false);
  };

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
        expiryAt: expiry,
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
      // Android: softwareKeyboardLayoutMode=resize already shrinks the window;
      // KAV behavior=height fights that. iOS still needs padding.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
      >
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
        <Text
          style={[
            styles.expiryResult,
            !expiry && styles.expiryResultMuted,
            rtl && styles.textRtl,
          ]}
          accessibilityLabel={expiryA11yLabel}
        >
          {expiryResultText}
        </Text>
        <View style={[styles.chips, rtl && styles.chipsRtl]}>
          {EXPIRY_PRESETS.map((p) => {
            const selected = selectedPreset === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => onPresetPress(p.id)}
                style={[styles.expiryChip, selected && styles.expiryChipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={[styles.chipText, selected && styles.chipTextOn]}>
                  {t(p.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={openPicker}
          style={[styles.pickDate, rtl && styles.pickDateRtl]}
          accessibilityRole="button"
          accessibilityLabel={t('pickDate')}
        >
          <Text style={[styles.pickDateText, rtl && styles.textRtl]}>
            {t('pickDate')}
          </Text>
        </Pressable>
        {showPicker ? (
          <>
            <DateTimePicker
              value={pickerDraft}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onValueChange={onPickerValueChange}
              onDismiss={onPickerDismiss}
            />
            {Platform.OS === 'ios' ? (
              <View style={[styles.pickerActions, rtl && styles.rowRtl]}>
                <Pressable
                  onPress={() => setShowPicker(false)}
                  style={styles.pickAction}
                  accessibilityRole="button"
                  accessibilityLabel={t('cancel')}
                >
                  <Text style={styles.pickActionMuted}>{t('cancel')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmPicker(pickerDraft)}
                  style={styles.pickAction}
                  accessibilityRole="button"
                  accessibilityLabel={t('pickDate')}
                >
                  <Text style={styles.pickDateText}>{t('pickDate')}</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : null}

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
  expiryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    minHeight: 44,
    justifyContent: 'center',
  },
  expiryChipOn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#111827',
    minHeight: 44,
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
  expiryResult: {
    fontSize: 16,
    color: '#111827',
    minHeight: 24,
  },
  expiryResultMuted: {
    color: '#9ca3af',
  },
  pickDate: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  pickDateRtl: { alignSelf: 'flex-end' },
  pickDateText: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '500',
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickAction: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  pickActionMuted: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
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
