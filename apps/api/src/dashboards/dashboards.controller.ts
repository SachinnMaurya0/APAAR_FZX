import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../generated/prisma/client';
import { OverviewQueryDto } from './dto/overview-query.dto';

@Controller('dashboards')
@UseGuards(AuthGuard, RolesGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('overview')
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  getOverview(@CurrentUser() user: any, @Query() query: OverviewQueryDto) {
    return this.dashboardsService.getOverview(user, query.asOf);
  }

  @Get('programmes/:id')
  @Roles(UserRole.AICTE_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INSTITUTION_OPERATOR)
  getProgrammeDetail(@Param('id') id: string, @CurrentUser() user: any, @Query() query: OverviewQueryDto) {
    return this.dashboardsService.getProgrammeDetail(id, user, query.asOf);
  }
}
