import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { AttendanceStatus } from '@smart-attendance/shared';
import { Attendance } from '../../entities/attendance.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepo: Repository<Attendance>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async getOverview(branchId?: string) {
    const todayStart = this.getTodayStart();

    // Total active employees
    const employeeWhere: Record<string, unknown> = { isActive: true };
    if (branchId) employeeWhere.branchId = branchId;
    const totalEmployees = await this.usersRepo.count({ where: employeeWhere });

    // Checked-in today
    const attendanceWhere: Record<string, unknown> = {
      checkInAt: MoreThanOrEqual(todayStart),
    };
    if (branchId) attendanceWhere.branchId = branchId;

    const checkedInToday = await this.attendanceRepo.count({
      where: attendanceWhere,
    });

    // Checked-out today
    const checkedOutToday = await this.attendanceRepo.count({
      where: {
        ...attendanceWhere,
        status: AttendanceStatus.CHECKED_OUT,
      },
    });

    // Late arrivals (after 8:30 AM Vietnam time)
    const lateThreshold = new Date(todayStart.getTime() + 8.5 * 60 * 60 * 1000);
    const lateCount = await this.attendanceRepo
      .createQueryBuilder('a')
      .where('a.check_in_at >= :todayStart', { todayStart })
      .andWhere('a.check_in_at > :lateThreshold', { lateThreshold })
      .andWhere(branchId ? 'a.branch_id = :branchId' : '1=1', { branchId })
      .getCount();

    return {
      totalEmployees,
      checkedInToday,
      checkedOutToday,
      notCheckedIn: totalEmployees - checkedInToday,
      lateCount,
    };
  }

  async getAttendanceStats(branchId?: string) {
    const todayStart = this.getTodayStart();
    const lateThreshold = new Date(todayStart.getTime() + 8.5 * 60 * 60 * 1000);

    const qb = this.attendanceRepo
      .createQueryBuilder('a')
      .innerJoin('a.user', 'u')
      .leftJoin('u.department', 'd')
      .select('d.id', 'departmentId')
      .addSelect('d.name', 'departmentName')
      .addSelect('COUNT(a.id)', 'total')
      .addSelect(
        `SUM(CASE WHEN a.check_in_at > :lateThreshold THEN 1 ELSE 0 END)`,
        'lateCount',
      )
      .addSelect(
        `SUM(CASE WHEN a.check_in_at <= :lateThreshold THEN 1 ELSE 0 END)`,
        'onTimeCount',
      )
      .where('a.check_in_at >= :todayStart', { todayStart })
      .setParameter('lateThreshold', lateThreshold)
      .groupBy('d.id')
      .addGroupBy('d.name');

    if (branchId) {
      qb.andWhere('a.branch_id = :branchId', { branchId });
    }

    return qb.getRawMany();
  }

  private getTodayStart(): Date {
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const vnDate = new Date(
      vnNow.getUTCFullYear(),
      vnNow.getUTCMonth(),
      vnNow.getUTCDate(),
    );
    return new Date(vnDate.getTime() - 7 * 60 * 60 * 1000);
  }
}
