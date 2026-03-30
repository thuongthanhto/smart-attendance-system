import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  createUserSchema,
  createBranchSchema,
  createBranchWifiSchema,
  checkInSchema,
  paginationSchema,
} from '../schemas';
import { Role } from '../constants';

describe('loginSchema', () => {
  it('should validate valid login', () => {
    const result = loginSchema.safeParse({ email: 'test@hdbank.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({ email: 'invalid', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const result = loginSchema.safeParse({ email: 'test@hdbank.com', password: '123' });
    expect(result.success).toBe(false);
  });
});

describe('createUserSchema', () => {
  it('should validate valid user', () => {
    const result = createUserSchema.safeParse({
      email: 'nv@hdbank.com',
      password: '123456',
      fullName: 'Nguyen Van A',
      role: Role.EMPLOYEE,
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing fullName', () => {
    const result = createUserSchema.safeParse({
      email: 'nv@hdbank.com',
      password: '123456',
      role: Role.EMPLOYEE,
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid role', () => {
    const result = createUserSchema.safeParse({
      email: 'nv@hdbank.com',
      password: '123456',
      fullName: 'Test',
      role: 'SUPER_ADMIN',
    });
    expect(result.success).toBe(false);
  });
});

describe('createBranchSchema', () => {
  it('should validate with default radius', () => {
    const result = createBranchSchema.safeParse({
      name: 'HDBank Q1',
      address: '123 Le Loi',
      latitude: 10.77,
      longitude: 106.70,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.radiusM).toBe(50); // default
    }
  });

  it('should reject latitude out of range', () => {
    const result = createBranchSchema.safeParse({
      name: 'Test',
      address: 'Test',
      latitude: 100, // invalid
      longitude: 106.70,
    });
    expect(result.success).toBe(false);
  });
});

describe('createBranchWifiSchema', () => {
  it('should validate correct BSSID format', () => {
    const result = createBranchWifiSchema.safeParse({ bssid: 'AA:BB:CC:DD:EE:FF' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid BSSID', () => {
    const result = createBranchWifiSchema.safeParse({ bssid: 'invalid-bssid' });
    expect(result.success).toBe(false);
  });

  it('should accept lowercase BSSID', () => {
    const result = createBranchWifiSchema.safeParse({ bssid: 'aa:bb:cc:dd:ee:ff' });
    expect(result.success).toBe(true);
  });
});

describe('checkInSchema', () => {
  it('should validate valid check-in', () => {
    const result = checkInSchema.safeParse({
      latitude: 10.7769,
      longitude: 106.7009,
      deviceId: 'device-123',
    });
    expect(result.success).toBe(true);
  });

  it('should accept optional bssid', () => {
    const result = checkInSchema.safeParse({
      latitude: 10.7769,
      longitude: 106.7009,
      deviceId: 'device-123',
      bssid: 'AA:BB:CC:DD:EE:FF',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing deviceId', () => {
    const result = checkInSchema.safeParse({
      latitude: 10.7769,
      longitude: 106.7009,
    });
    expect(result.success).toBe(false);
  });
});

describe('paginationSchema', () => {
  it('should use defaults for empty input', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('should coerce string to number', () => {
    const result = paginationSchema.safeParse({ page: '3', limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(3);
      expect(result.data.limit).toBe(50);
    }
  });

  it('should reject limit > 100', () => {
    const result = paginationSchema.safeParse({ limit: 200 });
    expect(result.success).toBe(false);
  });
});
