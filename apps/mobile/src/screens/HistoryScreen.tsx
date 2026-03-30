import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as api from '../lib/api';
import type { Attendance, CheckInMethod } from '@smart-attendance/shared';

export default function HistoryScreen() {
  const [data, setData] = useState<Attendance[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (p: number, append = false) => {
      try {
        const res = await api.getMyHistory(p, 20);
        setData((prev) => (append ? [...prev, ...res.data] : res.data));
        setHasMore(p < res.meta.totalPages);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    load(1);
  };

  const onEndReached = () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    load(next, true);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    });

  const methodColor = (m: CheckInMethod) =>
    m === 'WIFI' ? '#2563EB' : '#16A34A';

  const renderItem = ({ item }: { item: Attendance }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateLabel}>{formatDate(item.checkInAt)}</Text>
        <View
          style={[
            styles.methodBadge,
            { backgroundColor: methodColor(item.method) + '20' },
          ]}
        >
          <Text
            style={[styles.methodText, { color: methodColor(item.method) }]}
          >
            {item.method}
          </Text>
        </View>
      </View>

      <View style={styles.timesRow}>
        <View>
          <Text style={styles.timeLabel}>Check-in</Text>
          <Text style={styles.timeValue}>{formatTime(item.checkInAt)}</Text>
        </View>
        <View style={styles.divider} />
        <View>
          <Text style={styles.timeLabel}>Check-out</Text>
          <Text style={styles.timeValue}>
            {item.checkOutAt ? formatTime(item.checkOutAt) : '--:--'}
          </Text>
        </View>
        {item.distanceM != null && (
          <>
            <View style={styles.divider} />
            <View>
              <Text style={styles.timeLabel}>Khoảng cách</Text>
              <Text style={styles.timeValue}>
                {item.distanceM.toFixed(0)}m
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );

  if (loading && data.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <Text style={styles.empty}>Chưa có lịch sử chấm công</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  methodBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  methodText: { fontSize: 11, fontWeight: '700' },
  timesRow: { flexDirection: 'row', alignItems: 'center' },
  timeLabel: { fontSize: 11, color: '#9CA3AF' },
  timeValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 40,
  },
});
