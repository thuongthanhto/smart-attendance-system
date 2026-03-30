import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BSSID_CACHE_TTL_S } from '@smart-attendance/shared';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error', err.message);
    });
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  // ===== BSSID Cache =====

  private bssidKey(branchId: string): string {
    return `branch:${branchId}:bssids`;
  }

  async getBranchBssids(branchId: string): Promise<string[] | null> {
    const members = await this.client.smembers(this.bssidKey(branchId));
    return members.length > 0 ? members : null;
  }

  async setBranchBssids(branchId: string, bssids: string[]): Promise<void> {
    const key = this.bssidKey(branchId);
    if (bssids.length === 0) return;

    const pipeline = this.client.pipeline();
    pipeline.del(key);
    pipeline.sadd(key, ...bssids);
    pipeline.expire(key, BSSID_CACHE_TTL_S);
    await pipeline.exec();
  }

  async invalidateBranchBssids(branchId: string): Promise<void> {
    await this.client.del(this.bssidKey(branchId));
  }

  async isBssidInBranch(branchId: string, bssid: string): Promise<boolean> {
    return (await this.client.sismember(this.bssidKey(branchId), bssid)) === 1;
  }
}
