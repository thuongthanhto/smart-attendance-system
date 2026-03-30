import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Branch } from '../../entities/branch.entity';
import { BranchWifi } from '../../entities/branch-wifi.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateBranchWifiDto } from './dto/create-branch-wifi.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private branchesRepo: Repository<Branch>,
    @InjectRepository(BranchWifi)
    private wifiRepo: Repository<BranchWifi>,
    private redisService: RedisService,
  ) {}

  async create(dto: CreateBranchDto): Promise<Branch> {
    const branch = this.branchesRepo.create(dto);
    return this.branchesRepo.save(branch);
  }

  async findAll(query: PaginationDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const where = search ? { name: ILike(`%${search}%`) } : {};

    const [data, total] = await this.branchesRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
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

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchesRepo.findOne({
      where: { id },
      relations: ['wifiList'],
    });
    if (!branch) {
      throw new NotFoundException('Chi nhánh không tồn tại');
    }
    return branch;
  }

  async update(id: string, dto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findOne(id);
    Object.assign(branch, dto);
    return this.branchesRepo.save(branch);
  }

  async remove(id: string): Promise<void> {
    const branch = await this.findOne(id);
    await this.redisService.invalidateBranchBssids(id);
    await this.branchesRepo.remove(branch);
  }

  // ===== WiFi BSSID Management =====

  async addWifi(branchId: string, dto: CreateBranchWifiDto): Promise<BranchWifi> {
    await this.findOne(branchId); // ensure branch exists

    const exists = await this.wifiRepo.findOne({
      where: { branchId, bssid: dto.bssid.toUpperCase() },
    });
    if (exists) {
      throw new ConflictException('BSSID đã tồn tại cho chi nhánh này');
    }

    const wifi = this.wifiRepo.create({
      branchId,
      bssid: dto.bssid.toUpperCase(),
      description: dto.description || null,
    });

    const saved = await this.wifiRepo.save(wifi);
    await this.redisService.invalidateBranchBssids(branchId);
    return saved;
  }

  async removeWifi(branchId: string, wifiId: string): Promise<void> {
    const wifi = await this.wifiRepo.findOne({
      where: { id: wifiId, branchId },
    });
    if (!wifi) {
      throw new NotFoundException('WiFi BSSID không tồn tại');
    }
    await this.wifiRepo.remove(wifi);
    await this.redisService.invalidateBranchBssids(branchId);
  }

  async getWifiList(branchId: string): Promise<BranchWifi[]> {
    await this.findOne(branchId);
    return this.wifiRepo.find({ where: { branchId } });
  }

  async getBranchBssids(branchId: string): Promise<string[]> {
    // Try cache first
    const cached = await this.redisService.getBranchBssids(branchId);
    if (cached) return cached;

    // Cache miss -> query DB
    const wifiList = await this.wifiRepo.find({
      where: { branchId },
      select: ['bssid'],
    });
    const bssids = wifiList.map((w) => w.bssid);

    // Populate cache
    if (bssids.length > 0) {
      await this.redisService.setBranchBssids(branchId, bssids);
    }

    return bssids;
  }
}
