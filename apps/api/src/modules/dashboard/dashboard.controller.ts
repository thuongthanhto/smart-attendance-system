import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@smart-attendance/shared';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@Query('branchId') branchId?: string) {
    return this.dashboardService.getOverview(branchId);
  }

  @Get('attendance-stats')
  getAttendanceStats(@Query('branchId') branchId?: string) {
    return this.dashboardService.getAttendanceStats(branchId);
  }
}
