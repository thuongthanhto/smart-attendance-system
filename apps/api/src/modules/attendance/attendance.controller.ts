import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AttendanceService } from './attendance.service';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { Role } from '@smart-attendance/shared';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('check-in')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 300000, limit: 5 } }) // 5 attempts per 5 min
  checkIn(
    @CurrentUser() user: User,
    @Body() dto: CheckInDto,
    @Req() req: FastifyRequest,
  ) {
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = req.ip;
    return this.attendanceService.checkIn(user, dto, userAgent, ipAddress);
  }

  @Post('check-out')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { ttl: 300000, limit: 5 } })
  checkOut(
    @CurrentUser() user: User,
    @Body() dto: CheckOutDto,
    @Req() req: FastifyRequest,
  ) {
    const userAgent = req.headers['user-agent'] || null;
    const ipAddress = req.ip;
    return this.attendanceService.checkOut(user, dto, userAgent, ipAddress);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll(@Query() query: AttendanceQueryDto) {
    return this.attendanceService.findAll(query);
  }

  @Get('my-history')
  getMyHistory(
    @CurrentUser('id') userId: string,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendanceService.getMyHistory(userId, query);
  }
}
