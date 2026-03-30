import { z } from 'zod';

export const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  bssid: z.string().optional(),
  deviceId: z.string().min(1, 'Device ID không được để trống'),
});

export const checkOutSchema = z.object({
  deviceId: z.string().min(1, 'Device ID không được để trống'),
});
