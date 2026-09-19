import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { useSettings } from '../settings/SettingsContext';
import type { RootStackParamList } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const FAB_SIZE = 56;
const FAB_MARGIN = 16;

export function HomeScreen({ navigation }: Props) {
  const [entries, setEntries] = useState<BalanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rtl = isRtl();
  const insets = useSafeAreaInsets();
  const { colors, language } = useSettings();

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

  // Trailing gear → Settings. With Yoga LTR + isRtl(): LTR = headerRight, RTL = headerLeft.
  useLayoutEffect(() => {
    const gear = (
      <Pressable
        onPress={() => navigation.navigate('Settings')}
        accessibilityRole="button"
        accessibilityLabel={t('settingsA11y')}
        hitSlop={8}
        style={styles.headerBtn}
      >
        <Text style={[styles.gear, { color: colors.headerTint }]}>⚙</Text>
      </Pressable>
    );
    navigation.setOptions({
      title: t('title'),
      headerRight: rtl ? undefined : () => gear,
      headerLeft: rtl ? () => gear : undefined,
    });
  }, [navigation, rtl, colors.headerTint, language]);

  const openCreate = useCallback(() => {
    navigation.navigate('EditEntry', {});
  }, [navigation]);

  const stylesThemed = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        list: { flex: 1, backgroundColor: colors.background },
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
          backgroundColor: colors.card,
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
        merchant: { fontSize: 16, fontWeight: '600', color: colors.text },
        meta: { fontSize: 13, color: colors.muted },
        soonCue: { fontSize: 12, color: colors.soon, marginTop: 2 },
        expiredCue: { fontSize: 12, color: colors.muted, marginTop: 2 },
        balance: { fontSize: 16, fontWeight: '700', color: colors.text },
        balanceNeg: { color: colors.danger },
        mutedText: { color: colors.muted },
        empty: { fontSize: 18, fontWeight: '600', color: colors.text },
        muted: { fontSize: 14, color: colors.muted, textAlign: 'center' },
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
        retryText: { color: colors.primaryText, fontWeight: '600', fontSize: 15 },
        fab: {
          position: 'absolute',
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: FAB_SIZE / 2,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.22,
          shadowRadius: 8,
          elevation: 6,
        },
        fabPressed: { opacity: 0.9 },
        fabPlus: {
          color: colors.primaryText,
          fontSize: 32,
          fontWeight: '400',
          lineHeight: 36,
          marginTop: -2,
        },
      }),
    [colors],
  );

  const fabStyle = [
    stylesThemed.fab,
    {
      bottom: FAB_MARGIN + insets.bottom,
      ...(rtl
        ? { left: FAB_MARGIN + insets.left }
        : { right: FAB_MARGIN + insets.right }),
    },
  ];

  const fab = (
    <Pressable
      style={({ pressed }) => [fabStyle, pressed && stylesThemed.fabPressed]}
      onPress={openCreate}
      accessibilityRole="button"
      accessibilityLabel={t('addEntry')}
    >
      <Text style={stylesThemed.fabPlus} accessible={false}>
        +
      </Text>
    </Pressable>
  );

  if (loading && entries.length === 0 && !error) {
    return (
      <View style={stylesThemed.container}>
        <View style={stylesThemed.centered}>
          <ActivityIndicator color={colors.text} />
          <Text style={stylesThemed.muted}>{t('loading')}</Text>
        </View>
        {fab}
      </View>
    );
  }

  if (error) {
    return (
      <View style={[stylesThemed.container, stylesThemed.centered]}>
        <Text style={stylesThemed.error}>{error}</Text>
        <Pressable
          style={stylesThemed.retry}
          onPress={() => {
            setLoading(true);
            void load();
          }}
          accessibilityRole="button"
          accessibilityLabel={t('retry')}
        >
          <Text style={stylesThemed.retryText}>{t('retry')}</Text>
        </Pressable>
      </View>
    );
  }

  const listBottomPad = FAB_SIZE + FAB_MARGIN * 2 + insets.bottom;

  return (
    <View style={stylesThemed.container}>
      <FlatList
        style={stylesThemed.list}
        contentContainerStyle={[
          entries.length === 0 ? stylesThemed.centered : stylesThemed.content,
          { paddingBottom: listBottomPad },
        ]}
        data={entries}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.text}
          />
        }
        ListEmptyComponent={
          <View style={stylesThemed.centered}>
            <Text style={stylesThemed.empty}>{t('empty')}</Text>
            <Text style={stylesThemed.muted}>{t('emptyHint')}</Text>
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
              style={[
                stylesThemed.row,
                rtl && stylesThemed.rowRtl,
                expired && stylesThemed.rowMuted,
              ]}
              onPress={() => navigation.navigate('Detail', { entryId: item.id })}
              accessibilityRole="button"
              accessibilityLabel={a11y}
            >
              <View style={stylesThemed.rowText}>
                <Text
                  style={[stylesThemed.merchant, expired && stylesThemed.mutedText]}
                  numberOfLines={1}
                >
                  {item.merchant}
                </Text>
                <Text style={[stylesThemed.meta, expired && stylesThemed.mutedText]}>
                  {t(`types.${item.type}`)}
                </Text>
                {soon && expiryLabel ? (
                  <Text style={stylesThemed.soonCue}>
                    {t('expiresOn', { date: expiryLabel })}
                  </Text>
                ) : null}
                {expired ? (
                  <Text style={stylesThemed.expiredCue}>{t('expired')}</Text>
                ) : null}
              </View>
              <Text
                style={[
                  stylesThemed.balance,
                  negative && stylesThemed.balanceNeg,
                  expired && stylesThemed.mutedText,
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
  headerBtn: {
    paddingHorizontal: 8,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gear: { fontSize: 22 },
});
