import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { acquireLocationData, getDeviceId } from '../services/location.service';
import * as api from '../lib/api';
import { useAuthStore } from '../stores/auth.store';
import type { CheckInMethod } from '@smart-attendance/shared';

interface CheckInState {
  status: 'idle' | 'acquiring' | 'submitting' | 'success' | 'error';
  result?: {
    method: CheckInMethod;
    distanceM: number | null;
    checkInAt: string;
  };
  checkOutTime?: string;
  error?: string;
}

export default function CheckInScreen() {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<CheckInState>({ status: 'idle' });

  const handleCheckIn = async () => {
    setState({ status: 'acquiring' });
    try {
      const location = await acquireLocationData();

      setState({ status: 'submitting' });
      const result = await api.checkIn(location);

      setState({
        status: 'success',
        result: {
          method: result.method,
          distanceM: result.distanceM,
          checkInAt: result.checkInAt,
        },
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (err as Error)?.message ||
        'Check-in thất bại';
      setState({ status: 'error', error: msg });
      Alert.alert('Lỗi check-in', msg);
    }
  };

  const handleCheckOut = async () => {
    try {
      const deviceId = await getDeviceId();
      const result = await api.checkOut({ deviceId });
      setState((prev) => ({
        ...prev,
        checkOutTime: result.checkOutAt,
      }));
      Alert.alert('Thành công', 'Đã check-out!');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Check-out thất bại';
      Alert.alert('Lỗi', msg);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh',
    });

  const isProcessing =
    state.status === 'acquiring' || state.status === 'submitting';

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Xin chào,</Text>
      <Text style={styles.name}>{user?.fullName}</Text>

      <View style={styles.card}>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {state.status === 'success' && state.result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Đã check-in</Text>
            <Text style={styles.resultTime}>
              {formatTime(state.result.checkInAt)}
            </Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Phương thức:</Text>
              <View
                style={[
                  styles.badge,
                  state.result.method === 'WIFI'
                    ? styles.badgeWifi
                    : styles.badgeGps,
                ]}
              >
                <Text style={styles.badgeText}>{state.result.method}</Text>
              </View>
            </View>
            {state.result.distanceM != null && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Khoảng cách:</Text>
                <Text style={styles.resultValue}>
                  {state.result.distanceM.toFixed(0)}m
                </Text>
              </View>
            )}
            {state.checkOutTime && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Check-out:</Text>
                <Text style={styles.resultValue}>
                  {formatTime(state.checkOutTime)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Check-in button */}
        <TouchableOpacity
          style={[
            styles.checkInButton,
            (isProcessing || state.status === 'success') &&
              styles.buttonDisabled,
          ]}
          onPress={handleCheckIn}
          disabled={isProcessing || state.status === 'success'}
        >
          {isProcessing ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.checkInButtonText}>
                {state.status === 'acquiring'
                  ? 'Đang lấy vị trí...'
                  : 'Đang gửi...'}
              </Text>
            </View>
          ) : state.status === 'success' ? (
            <Text style={styles.checkInButtonText}>Đã check-in</Text>
          ) : (
            <Text style={styles.checkInButtonText}>CHECK-IN</Text>
          )}
        </TouchableOpacity>

        {/* Check-out button */}
        {state.status === 'success' && !state.checkOutTime && (
          <TouchableOpacity
            style={styles.checkOutButton}
            onPress={handleCheckOut}
          >
            <Text style={styles.checkOutButtonText}>CHECK-OUT</Text>
          </TouchableOpacity>
        )}

        {/* Retry on error */}
        {state.status === 'error' && (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={handleCheckIn}
          >
            <Text style={styles.checkInButtonText}>THỬ LẠI</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.hint}>
        Đảm bảo bật GPS và kết nối WiFi chi nhánh để check-in nhanh hơn
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    justifyContent: 'center',
  },
  greeting: { fontSize: 16, color: '#6B7280' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  resultBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 4,
  },
  resultTime: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  resultLabel: { fontSize: 13, color: '#6B7280', marginRight: 8 },
  resultValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeWifi: { backgroundColor: '#DBEAFE' },
  badgeGps: { backgroundColor: '#DCFCE7' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#1E40AF' },
  checkInButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#93C5FD' },
  checkInButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkOutButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  checkOutButtonText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
  },
});
