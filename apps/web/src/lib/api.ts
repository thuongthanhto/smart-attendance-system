import api from './axios';
import type {
  PaginatedResponse,
  PaginationQuery,
} from '@smart-attendance/shared';

// ===== Dashboard =====
export async function fetchOverview(branchId?: string) {
  const params = branchId ? { branchId } : {};
  const { data } = await api.get('/dashboard/overview', { params });
  return data.data;
}

export async function fetchAttendanceStats(branchId?: string) {
  const params = branchId ? { branchId } : {};
  const { data } = await api.get('/dashboard/attendance-stats', { params });
  return data.data;
}

// ===== Users =====
export async function fetchUsers(query: PaginationQuery & { search?: string }) {
  const { data } = await api.get('/users', { params: query });
  return data.data as PaginatedResponse<unknown>;
}

export async function createUser(payload: Record<string, unknown>) {
  const { data } = await api.post('/users', payload);
  return data.data;
}

export async function updateUser(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data.data;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
}

// ===== Branches =====
export async function fetchBranches(query: PaginationQuery) {
  const { data } = await api.get('/branches', { params: query });
  return data.data as PaginatedResponse<unknown>;
}

export async function createBranch(payload: Record<string, unknown>) {
  const { data } = await api.post('/branches', payload);
  return data.data;
}

export async function updateBranch(id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/branches/${id}`, payload);
  return data.data;
}

export async function deleteBranch(id: string) {
  await api.delete(`/branches/${id}`);
}

export async function fetchBranchWifi(branchId: string) {
  const { data } = await api.get(`/branches/${branchId}/wifi`);
  return data.data;
}

export async function addBranchWifi(branchId: string, payload: { bssid: string; description?: string }) {
  const { data } = await api.post(`/branches/${branchId}/wifi`, payload);
  return data.data;
}

export async function removeBranchWifi(branchId: string, wifiId: string) {
  await api.delete(`/branches/${branchId}/wifi/${wifiId}`);
}

// ===== Attendance =====
export async function fetchAttendance(query: PaginationQuery & Record<string, unknown>) {
  const { data } = await api.get('/attendance', { params: query });
  return data.data as PaginatedResponse<unknown>;
}
