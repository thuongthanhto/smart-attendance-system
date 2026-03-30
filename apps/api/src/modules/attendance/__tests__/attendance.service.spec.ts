import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { AttendanceService } from '../attendance.service';
import { Attendance } from '../../../entities/attendance.entity';
import { AttendanceAuditLog } from '../../../entities/attendance-audit-log.entity';
import { Branch } from '../../../entities/branch.entity';
import { BranchesService } from '../../branches/branches.service';
import {
  AttendanceStatus,
  CheckInMethod,
} from '@smart-attendance/shared';
import { User } from '../../../entities/user.entity';
import { Role } from '@smart-attendance/shared';

// ===== Mock factories =====

const mockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'test@hdbank.com',
    fullName: 'Test User',
    role: Role.EMPLOYEE,
    branchId: 'branch-1',
    isActive: true,
    ...overrides,
  }) as User;

const mockBranch = (overrides: Partial<Branch> = {}): Branch =>
  ({
    id: 'branch-1',
    name: 'HDBank HQ',
    latitude: 10.7769,
    longitude: 106.7009,
    radiusM: 50,
    isActive: true,
    ...overrides,
  }) as Branch;

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceRepo: Record<string, jest.Mock>;
  let branchRepo: Record<string, jest.Mock>;
  let auditLogRepo: Record<string, jest.Mock>;
  let branchesService: Record<string, jest.Mock>;

  beforeEach(async () => {
    attendanceRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => ({ id: 'att-1', ...data })),
      save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'att-1', ...data })),
    };
    branchRepo = {
      findOne: jest.fn().mockResolvedValue(mockBranch()),
    };
    auditLogRepo = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockResolvedValue({}),
    };
    branchesService = {
      getBranchBssids: jest.fn().mockResolvedValue(['AA:BB:CC:DD:EE:01', 'AA:BB:CC:DD:EE:02']),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: getRepositoryToken(Attendance), useValue: attendanceRepo },
        { provide: getRepositoryToken(Branch), useValue: branchRepo },
        { provide: getRepositoryToken(AttendanceAuditLog), useValue: auditLogRepo },
        { provide: BranchesService, useValue: branchesService },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  // ===== Test 1: BSSID match -> WIFI method =====
  it('should approve check-in via WIFI when BSSID matches', async () => {
    const result = await service.checkIn(
      mockUser(),
      { latitude: 10.7769, longitude: 106.7009, bssid: 'AA:BB:CC:DD:EE:01', deviceId: 'dev-1' },
      'Mozilla/5.0',
      '127.0.0.1',
    );

    expect(result.method).toBe(CheckInMethod.WIFI);
    expect(attendanceRepo.save).toHaveBeenCalled();
  });

  // ===== Test 2: BSSID no match + GPS within 50m -> GPS method =====
  it('should approve check-in via GPS when BSSID not matched but within radius', async () => {
    const result = await service.checkIn(
      mockUser(),
      {
        latitude: 10.77695, // ~5m away
        longitude: 106.7009,
        bssid: 'FF:FF:FF:FF:FF:FF', // unknown BSSID
        deviceId: 'dev-1',
      },
      'Mozilla/5.0',
      '127.0.0.1',
    );

    expect(result.method).toBe(CheckInMethod.GPS);
    expect(result.distanceM).toBeLessThan(50);
  });

  // ===== Test 3: BSSID no match + GPS > 50m -> rejected =====
  it('should reject check-in when BSSID not matched and GPS out of range', async () => {
    await expect(
      service.checkIn(
        mockUser(),
        {
          latitude: 10.78, // ~350m away
          longitude: 106.7009,
          bssid: 'FF:FF:FF:FF:FF:FF',
          deviceId: 'dev-1',
        },
        'Mozilla/5.0',
        '127.0.0.1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // ===== Test 4: Already checked in -> rejected =====
  it('should reject when already checked in today', async () => {
    attendanceRepo.findOne.mockResolvedValueOnce({
      id: 'existing',
      status: AttendanceStatus.CHECKED_IN,
    });

    await expect(
      service.checkIn(
        mockUser(),
        { latitude: 10.7769, longitude: 106.7009, bssid: 'AA:BB:CC:DD:EE:01', deviceId: 'dev-1' },
        'Mozilla/5.0',
        '127.0.0.1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // ===== Test 5: No branch assigned -> rejected =====
  it('should reject when user has no branch assigned', async () => {
    await expect(
      service.checkIn(
        mockUser({ branchId: null }),
        { latitude: 10.7769, longitude: 106.7009, deviceId: 'dev-1' },
        'Mozilla/5.0',
        '127.0.0.1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // ===== Test 6: Mock location detected -> rejected + audit =====
  it('should reject and log audit when mock location is detected', async () => {
    await expect(
      service.checkIn(
        mockUser(),
        {
          latitude: 10.7769,
          longitude: 106.7009,
          bssid: 'AA:BB:CC:DD:EE:01',
          deviceId: 'dev-1',
          isFromMockProvider: true,
        },
        'Mozilla/5.0',
        '127.0.0.1',
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(auditLogRepo.save).toHaveBeenCalled();
    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'MOCK_LOCATION' }),
    );
  });

  // ===== Test 7: GPS only (no BSSID) within range -> approved =====
  it('should approve GPS-only check-in when within radius', async () => {
    const result = await service.checkIn(
      mockUser(),
      {
        latitude: 10.77695, // ~5m away
        longitude: 106.7009,
        deviceId: 'dev-1',
        // no bssid
      },
      'Mozilla/5.0',
      '127.0.0.1',
    );

    expect(result.method).toBe(CheckInMethod.GPS);
  });

  // ===== Test 8: BSSID match but GPS > 500m -> approved with anomaly audit =====
  it('should approve BSSID match but log anomaly when GPS > 500m', async () => {
    const result = await service.checkIn(
      mockUser(),
      {
        latitude: 11.0, // ~25km away
        longitude: 106.7009,
        bssid: 'AA:BB:CC:DD:EE:01',
        deviceId: 'dev-1',
      },
      'Mozilla/5.0',
      '127.0.0.1',
    );

    expect(result.method).toBe(CheckInMethod.WIFI);
    expect(auditLogRepo.save).toHaveBeenCalled();
    expect(auditLogRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'BSSID_GPS_MISMATCH' }),
    );
  });

  // ===== Test: deviceId + userAgent logged =====
  it('should log deviceId and userAgent in attendance record', async () => {
    await service.checkIn(
      mockUser(),
      { latitude: 10.7769, longitude: 106.7009, bssid: 'AA:BB:CC:DD:EE:01', deviceId: 'my-device-123' },
      'SmartAttendance/1.0 Android',
      '192.168.1.100',
    );

    expect(attendanceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'my-device-123',
        userAgent: 'SmartAttendance/1.0 Android',
        ipAddress: '192.168.1.100',
      }),
    );
  });
});
