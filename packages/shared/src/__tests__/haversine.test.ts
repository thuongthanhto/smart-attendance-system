import { describe, it, expect } from 'vitest';
import { haversineDistance } from '../utils/haversine';

describe('haversineDistance', () => {
  it('should return 0 for same coordinates', () => {
    const d = haversineDistance(10.7769, 106.7009, 10.7769, 106.7009);
    expect(d).toBe(0);
  });

  it('should calculate correct distance for known pair (HCM -> Ha Noi ~1,200km)', () => {
    // HCM: 10.8231, 106.6297 | HN: 21.0285, 105.8542
    const d = haversineDistance(10.8231, 106.6297, 21.0285, 105.8542);
    expect(d).toBeGreaterThan(1_100_000); // > 1100 km
    expect(d).toBeLessThan(1_300_000);    // < 1300 km
  });

  it('should calculate short distance correctly (~30m within a building)', () => {
    // Two points ~30m apart near HDBank HQ
    const d = haversineDistance(10.7769, 106.7009, 10.77715, 106.7009);
    expect(d).toBeGreaterThan(20);
    expect(d).toBeLessThan(40);
  });

  it('should return distance within 50m radius for nearby point', () => {
    // Point 40m north of HDBank HQ
    const d = haversineDistance(10.7769, 106.7009, 10.77726, 106.7009);
    expect(d).toBeLessThanOrEqual(50);
  });

  it('should return distance > 50m for point outside radius', () => {
    // Point ~100m away
    const d = haversineDistance(10.7769, 106.7009, 10.7778, 106.7009);
    expect(d).toBeGreaterThan(50);
  });

  it('should be symmetric (d(A,B) == d(B,A))', () => {
    const d1 = haversineDistance(10.7769, 106.7009, 21.0285, 105.8542);
    const d2 = haversineDistance(21.0285, 105.8542, 10.7769, 106.7009);
    expect(d1).toBeCloseTo(d2, 6);
  });

  it('should handle equator crossing', () => {
    const d = haversineDistance(1, 100, -1, 100);
    expect(d).toBeGreaterThan(200_000); // ~222km
    expect(d).toBeLessThan(230_000);
  });

  it('should handle antimeridian crossing', () => {
    const d = haversineDistance(0, 179, 0, -179);
    expect(d).toBeGreaterThan(200_000); // ~222km
    expect(d).toBeLessThan(230_000);
  });
});
