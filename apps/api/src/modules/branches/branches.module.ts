import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { Branch } from '../../entities/branch.entity';
import { BranchWifi } from '../../entities/branch-wifi.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Branch, BranchWifi])],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
