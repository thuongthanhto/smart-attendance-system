export const DEFAULT_RADIUS_M = 50;
export const BSSID_CACHE_TTL_S = 3600; // 1 hour
export const CHECK_IN_RATE_LIMIT = 5;
export const CHECK_IN_RATE_WINDOW_S = 300; // 5 minutes

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum AttendanceStatus {
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
}

export enum CheckInMethod {
  WIFI = 'WIFI',
  GPS = 'GPS',
}

export const TIMEZONE = 'Asia/Ho_Chi_Minh';
