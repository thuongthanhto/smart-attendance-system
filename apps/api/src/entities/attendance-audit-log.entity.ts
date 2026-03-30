import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('attendance_audit_log')
@Index(['userId', 'createdAt'])
export class AttendanceAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  /** e.g. MOCK_LOCATION, BSSID_GPS_MISMATCH, GPS_OUT_OF_RANGE */
  @Column({ length: 50 })
  reason: string;

  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @Column({ type: 'double precision', nullable: true })
  latitude: number | null;

  @Column({ type: 'double precision', nullable: true })
  longitude: number | null;

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
}
