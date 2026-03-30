import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AttendanceStatus, CheckInMethod } from '@smart-attendance/shared';
import { User } from './user.entity';
import { Branch } from './branch.entity';

@Entity('attendance')
@Index(['userId', 'checkInAt'])
@Index(['branchId', 'checkInAt'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @Column({ name: 'check_in_at', type: 'timestamptz' })
  checkInAt: Date;

  @Column({ name: 'check_out_at', type: 'timestamptz', nullable: true })
  checkOutAt: Date | null;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.CHECKED_IN,
  })
  status: AttendanceStatus;

  @Column({ type: 'enum', enum: CheckInMethod })
  method: CheckInMethod;

  @Column({ name: 'distance_m', type: 'double precision', nullable: true })
  distanceM: number | null;

  @Column({ length: 17, nullable: true })
  bssid: string | null;

  @Column({ name: 'device_id', length: 255, nullable: true })
  deviceId: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.attendances)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
