import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

// Helper: extrai managerId do utilizador autenticado quando é gestor
const managerScope = (user: any): string | undefined =>
  user?.role === 'gestor' ? user.id : undefined;

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles('admin', 'gestor', 'supervisor')
  getSummary(@CurrentUser() user: any) {
    return this.dashboardService.getExecutiveSummary(managerScope(user));
  }

  @Get('credit-stats')
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  getCreditStats(@CurrentUser() user: any) {
    return this.dashboardService.getCreditStats(managerScope(user));
  }

  @Get('client-stats')
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  getClientStats(@CurrentUser() user: any) {
    return this.dashboardService.getClientStats(managerScope(user));
  }

  @Get('credit-trend')
  @Roles('admin', 'gestor', 'supervisor')
  getCreditTrend(@Query('months') months?: number, @CurrentUser() user?: any) {
    return this.dashboardService.getCreditTrend(months, managerScope(user));
  }

  @Get('risk-distribution')
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  getRiskDistribution(@CurrentUser() user: any) {
    return this.dashboardService.getRiskDistribution(managerScope(user));
  }

  @Get('recent-activity')
  @Roles('admin', 'gestor', 'supervisor')
  getRecentActivity(@Query('limit') limit?: number, @CurrentUser() user?: any) {
    return this.dashboardService.getRecentActivity(limit, managerScope(user));
  }

  @Get('analyst-performance')
  @Roles('admin', 'gestor', 'supervisor')
  getAnalystPerformance(@CurrentUser() user: any) {
    return this.dashboardService.getAnalystPerformance(managerScope(user));
  }
}
