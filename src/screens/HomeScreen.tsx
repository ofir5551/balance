import { useCallback, useState } from 'react';
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
import { listEntries } from '../db/repository';
import type { BalanceEntry } from '../models/types';
import { formatMoney } from '../components/format';
import { t } from '../i18n';
import type { RootStackParamList } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const [entries, setEntries] = useState<BalanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading && entries.length === 0) {
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
        return (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('Detail', { entryId: item.id })}
          >
            <View style={styles.rowText}>
              <Text style={styles.merchant}>{item.merchant}</Text>
              <Text style={styles.meta}>{t(`types.${item.type}`)}</Text>
            </View>
            <Text style={[styles.balance, negative && styles.balanceNeg]}>
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
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  rowText: { flex: 1, gap: 2 },
  merchant: { fontSize: 16, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 13, color: '#6b7280' },
  balance: { fontSize: 16, fontWeight: '700', color: '#111827' },
  balanceNeg: { color: '#dc2626' },
  empty: { fontSize: 18, fontWeight: '600', color: '#111827' },
  muted: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  error: { fontSize: 15, color: '#dc2626', textAlign: 'center' },
});
