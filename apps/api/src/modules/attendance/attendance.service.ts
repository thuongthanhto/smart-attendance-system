import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, FindOptionsWhere } from 'typeorm';
import {
  AttendanceStatus,
  CheckInMethod,
  haversineDistance,
} from '@smart-attendance/shared';
import { Attendance } from '../../entities/attendance.entity';
import { AttendanceAuditLog } from '../../entities/attendance-audit-log.entity';
import { User } from '../../entities/user.entity';
import { Branch } from '../../entities/branch.entity';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { BranchesService } from '../branches/branches.service';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Branch)
    private branchesRepo: Repository<Branch>,
    @InjectRepository(AttendanceAuditLog)
    private auditLogRepo: Repository<AttendanceAuditLog>,
    private branchesService: BranchesService,
  ) {}

  async checkIn(
    user: User,
    dto: CheckInDto,
    userAgent: string | null,
    ipAddress: string | null,
  ) {
    // 1. User must have a branch assigned
    if (!user.branchId) {
      throw new BadRequestException('Bạn chưa được gán chi nhánh');
    }

    // 2. Check if already checked in today
    const todayStart = this.getTodayStart();
    const existing = await this.attendanceRepo.findOne({
      where: {
        userId: user.id,
        status: AttendanceStatus.CHECKED_IN,
        checkInAt: MoreThanOrEqual(todayStart),
      },
    });
    if (existing) {
      throw new BadRequestException('Bạn đã check-in hôm nay rồi');
    }

    // 3. Get branch info
    const branch = await this.branchesRepo.findOne({
      where: { id: user.branchId, isActive: true },
    });
    if (!branch) {
      throw new BadRequestException('Chi nhánh không tồn tại hoặc đã bị vô hiệu hóa');
    }

    // 4. Mock location detection (Android)
    if (dto.isFromMockProvider) {
      this.logger.warn(
        `MOCK_LOCATION: user=${user.id} device=${dto.deviceId} ip=${ipAddress}`,
      );
      await this.saveAuditLog(user.id, branch.id, 'MOCK_LOCATION', dto, userAgent, ipAddress);
      throw new ForbiddenException('Phát hiện vị trí giả lập. Không thể check-in.');
    }

    // 5. Anti-cheat validation
    let method: CheckInMethod;
    let distanceM: number | null = null;

    // Step 1: BSSID match (Redis cached)
    if (dto.bssid) {
      const bssids = await this.branchesService.getBranchBssids(branch.id);
      const bssidUpper = dto.bssid.toUpperCase();

      if (bssids.includes(bssidUpper)) {
        method = CheckInMethod.WIFI;

        // Cross-reference: log warning if GPS too far (possible spoof)
        const gpsDistance = haversineDistance(
          dto.latitude,
          dto.longitude,
          branch.latitude,
          branch.longitude,
        );
        distanceM = gpsDistance;
        if (gpsDistance > 500) {
          this.logger.warn(
            `ANOMALY: BSSID match but GPS distance=${gpsDistance.toFixed(0)}m for user=${user.id} branch=${branch.id}`,
          );
          await this.saveAuditLog(
            user.id, branch.id, 'BSSID_GPS_MISMATCH', dto, userAgent, ipAddress,
            `BSSID matched but GPS ${gpsDistance.toFixed(0)}m away`,
          );
        }
      } else {
        // BSSID not matched, fall through to GPS
        method = this.validateGps(dto, branch);
        distanceM = haversineDistance(
          dto.latitude,
          dto.longitude,
          branch.latitude,
          branch.longitude,
        );
      }
    } else {
      // No BSSID provided, GPS only
      method = this.validateGps(dto, branch);
      distanceM = haversineDistance(
        dto.latitude,
        dto.longitude,
        branch.latitude,
        branch.longitude,
      );
    }

    // 5. Save attendance record
    const attendance = this.attendanceRepo.create({
      userId: user.id,
      branchId: branch.id,
      checkInAt: new Date(),
      status: AttendanceStatus.CHECKED_IN,
      method,
      distanceM,
      bssid: dto.bssid?.toUpperCase() || null,
      deviceId: dto.deviceId,
      userAgent,
      ipAddress,
    });

    const saved = await this.attendanceRepo.save(attendance);

    this.logger.log(
      `Check-in: user=${user.id} branch=${branch.id} method=${method} distance=${distanceM?.toFixed(0) ?? 'N/A'}m device=${dto.deviceId}`,
    );

    return {
      id: saved.id,
      method: saved.method,
      distanceM: saved.distanceM,
      checkInAt: saved.checkInAt.toISOString(),
    };
  }

  async checkOut(
    user: User,
    dto: CheckOutDto,
    userAgent: string | null,
    ipAddress: string | null,
  ) {
    const todayStart = this.getTodayStart();
    const attendance = await this.attendanceRepo.findOne({
      where: {
        userId: user.id,
        status: AttendanceStatus.CHECKED_IN,
        checkInAt: MoreThanOrEqual(todayStart),
      },
    });

    if (!attendance) {
      throw new BadRequestException('Bạn chưa check-in hôm nay');
    }

    attendance.checkOutAt = new Date();
    attendance.status = AttendanceStatus.CHECKED_OUT;

    const saved = await this.attendanceRepo.save(attendance);

    this.logger.log(
      `Check-out: user=${user.id} device=${dto.deviceId}`,
    );

    return {
      id: saved.id,
      checkInAt: saved.checkInAt.toISOString(),
      checkOutAt: saved.checkOutAt!.toISOString(),
    };
  }

  async findAll(query: AttendanceQueryDto) {
    const { page = 1, limit = 20, branchId, userId, from, to } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Attendance> = {};
    if (branchId) where.branchId = branchId;
    if (userId) where.userId = userId;
    if (from && to) {
      where.checkInAt = Between(new Date(from), new Date(to));
    }

    const [data, total] = await this.attendanceRepo.findAndCount({
      where,
      relations: ['user', 'branch'],
      order: { checkInAt: 'DESC' },
      skip,
      take: limit,
      select: {
        user: { id: true, fullName: true, email: true },
        branch: { id: true, name: true },
      },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyHistory(userId: string, query: AttendanceQueryDto) {
    return this.findAll({ ...query, userId });
  }

  // ===== Private helpers =====

  private validateGps(dto: CheckInDto, branch: Branch): CheckInMethod {
    const distance = haversineDistance(
      dto.latitude,
      dto.longitude,
      branch.latitude,
      branch.longitude,
    );

    if (distance > branch.radiusM) {
      this.logger.warn(
        `GPS_REJECTED: user distance=${distance.toFixed(0)}m > radius=${branch.radiusM}m branch=${branch.id}`,
      );
      throw new ForbiddenException(
        `Bạn đang cách chi nhánh ${distance.toFixed(0)}m (cho phép: ${branch.radiusM}m)`,
      );
    }

    return CheckInMethod.GPS;
  }

  private async saveAuditLog(
    userId: string,
    branchId: string,
    reason: string,
    dto: CheckInDto,
    userAgent: string | null,
    ipAddress: string | null,
    detail?: string,
  ): Promise<void> {
    await this.auditLogRepo.save(
      this.auditLogRepo.create({
        userId,
        branchId,
        reason,
        detail: detail || null,
        latitude: dto.latitude,
        longitude: dto.longitude,
        bssid: dto.bssid?.toUpperCase() || null,
        deviceId: dto.deviceId,
        userAgent,
        ipAddress,
      }),
    );
  }

  private getTodayStart(): Date {
    const now = new Date();
    // Use UTC-based day boundary adjusted for Vietnam timezone (+7)
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const vnDate = new Date(
      vnNow.getUTCFullYear(),
      vnNow.getUTCMonth(),
      vnNow.getUTCDate(),
    );
    // Convert back to UTC
    return new Date(vnDate.getTime() - 7 * 60 * 60 * 1000);
  }
}
