import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RiskRepository } from './risk.repository';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('risk')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'analista', 'gestor', 'supervisor')
export class RiskController {
  constructor(private readonly riskRepository: RiskRepository) {}

  /** Todas as avaliações de risco — usado pela RiscoPage do backoffice */
  @Get('assessments')
  findAll(@Query('risk_level') riskLevel?: string, @CurrentUser() user?: any) {
    const filters: any = riskLevel ? { risk_level: riskLevel } : {};
    if (user?.role === 'gestor') filters.managerId = user.id;
    return this.riskRepository.findAll(filters);
  }

  /**
   * Alias para /risk/assessments — mantém compatibilidade com o frontend
   * que chama GET /risk/client/all
   * NOTA: deve vir antes de /risk/client/:clientId para não ser capturado por ela
   */
  @Get('client/all')
  findAllAlias(@Query('risk_level') riskLevel?: string, @CurrentUser() user?: any) {
    const filters: any = riskLevel ? { risk_level: riskLevel } : {};
    if (user?.role === 'gestor') filters.managerId = user.id;
    return this.riskRepository.findAll(filters);
  }

  @Get('credit/:creditId')
  getByCredit(@Param('creditId') creditId: string) {
    return this.riskRepository.findByCreditId(creditId);
  }

  @Get('client/:clientId')
  getByClient(@Param('clientId') clientId: string) {
    return this.riskRepository.findByClientId(clientId);
  }
}
