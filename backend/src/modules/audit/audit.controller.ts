import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'supervisor')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.auditService.findAll(query);
  }

  @Get('report')
  getReport(@Query('start_date') startDate: string, @Query('end_date') endDate: string) {
    return this.auditService.getActivityReport(startDate, endDate);
  }

  @Get('user/:userId')
  getUserActivity(@Param('userId') userId: string, @Query('limit') limit?: number) {
    return this.auditService.getUserActivity(userId, limit);
  }

  @Get('entity/:entityType/:entityId')
  getEntityHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
