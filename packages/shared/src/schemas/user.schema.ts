import { z } from 'zod';
import { Role } from '../constants';

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export const createUserSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  fullName: z.string().min(1, 'Tên không được để trống').max(100),
  role: z.nativeEnum(Role),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  branchId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});
