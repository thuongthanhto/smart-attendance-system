import { AttendanceStatus, CheckInMethod } from '../constants';

export interface Attendance {
  id: string;
  userId: string;
  branchId: string;
  checkInAt: string;
  checkOutAt: string | null;
  status: AttendanceStatus;
  method: CheckInMethod;
  distanceM: number | null;
  bssid: string | null;
  deviceId: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface CheckInPayload {
  latitude: number;
  longitude: number;
  bssid?: string;
  deviceId: string;
}

export interface CheckOutPayload {
  deviceId: string;
}

export interface CheckInResult {
  id: string;
  method: CheckInMethod;
  distanceM: number | null;
  checkInAt: string;
}
