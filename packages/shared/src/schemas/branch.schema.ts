import { z } from 'zod';
import { DEFAULT_RADIUS_M } from '../constants';

export const createBranchSchema = z.object({
  name: z.string().min(1, 'Tên chi nhánh không được để trống').max(200),
  address: z.string().min(1, 'Địa chỉ không được để trống').max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusM: z.number().min(10).max(500).default(DEFAULT_RADIUS_M),
});

export const updateBranchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().min(1).max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusM: z.number().min(10).max(500).optional(),
  isActive: z.boolean().optional(),
});

export const createBranchWifiSchema = z.object({
  bssid: z
    .string()
    .regex(
      /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/,
      'BSSID phải đúng định dạng MAC (XX:XX:XX:XX:XX:XX)',
    ),
  description: z.string().max(200).optional(),
});
