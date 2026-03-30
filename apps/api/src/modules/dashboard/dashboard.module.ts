import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Attendance } from '../../entities/attendance.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, User])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
