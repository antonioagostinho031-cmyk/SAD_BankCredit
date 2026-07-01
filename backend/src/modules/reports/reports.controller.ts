import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'gestor', 'supervisor')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('credit')
  getCreditReport(@Query() query: any, @CurrentUser() user: any) {
    const managerId = user?.role === 'gestor' ? user.id : undefined;
    return this.reportsService.generateCreditReport(query, managerId);
  }

  @Get('clients')
  getClientReport(@Query() query: any, @CurrentUser() user: any) {
    const managerId = user?.role === 'gestor' ? user.id : undefined;
    return this.reportsService.generateClientReport(query, managerId);
  }

  @Get('risk')
  getRiskReport(@Query() query: any, @CurrentUser() user: any) {
    const managerId = user?.role === 'gestor' ? user.id : undefined;
    return this.reportsService.generateRiskReport(query, managerId);
  }

  @Get('documents')
  getDocumentReport(@Query() query: any, @CurrentUser() user: any) {
    const managerId = user?.role === 'gestor' ? user.id : undefined;
    return this.reportsService.generateDocumentReport(query, managerId);
  }
}
