import { AdminService } from './admin.service';
import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorater';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { GetHouseholdsQueryDto } from './dto/get-households.dto';
@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles('ADMIN')
  getAllHouseholds(@Query() query: GetHouseholdsQueryDto) {
    return this.adminService.getAllHouseholds(query);
  }

  @Get(':id')
  @Roles('ADMIN')
  getHouseholdDetail(@Param('id') id: string) {
    return this.adminService.getHouseholdDetail(Number(id));
  }
  @Get('dashboard/stats')
  @Roles('ADMIN')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
