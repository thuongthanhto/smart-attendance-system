import api from './axios';
import type { CheckInResult, Attendance } from '@smart-attendance/shared';

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data as { accessToken: string; refreshToken: string };
}

export async function getProfile() {
  const { data } = await api.get('/auth/me');
  return data.data;
}

export async function checkIn(payload: {
  latitude: number;
  longitude: number;
  bssid?: string;
  deviceId: string;
  isFromMockProvider?: boolean;
}): Promise<CheckInResult> {
  const { data } = await api.post('/attendance/check-in', payload);
  return data.data;
}

export async function checkOut(payload: { deviceId: string }) {
  const { data } = await api.post('/attendance/check-out', payload);
  return data.data;
}

export async function getMyHistory(page = 1, limit = 20) {
  const { data } = await api.get('/attendance/my-history', {
    params: { page, limit },
  });
  return data.data as {
    data: Attendance[];
    meta: { total: number; page: number; totalPages: number };
  };
}
