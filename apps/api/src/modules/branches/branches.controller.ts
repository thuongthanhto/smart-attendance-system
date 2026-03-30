import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateBranchWifiDto } from './dto/create-branch-wifi.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@smart-attendance/shared';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll(@Query() query: PaginationDto) {
    return this.branchesService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.remove(id);
  }

  // ===== WiFi BSSID Endpoints =====

  @Get(':id/wifi')
  @Roles(Role.ADMIN, Role.MANAGER)
  getWifiList(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.getWifiList(id);
  }

  @Post(':id/wifi')
  @Roles(Role.ADMIN)
  addWifi(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBranchWifiDto,
  ) {
    return this.branchesService.addWifi(id, dto);
  }

  @Delete(':id/wifi/:wifiId')
  @Roles(Role.ADMIN)
  removeWifi(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('wifiId', ParseUUIDPipe) wifiId: string,
  ) {
    return this.branchesService.removeWifi(id, wifiId);
  }
}
