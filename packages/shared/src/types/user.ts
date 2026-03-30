import { Role } from '../constants';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  branchId: string | null;
  departmentId: string | null;
  deviceId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  branchId?: string;
  departmentId?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  role?: Role;
  branchId?: string;
  departmentId?: string;
  isActive?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  branchId: string | null;
}
