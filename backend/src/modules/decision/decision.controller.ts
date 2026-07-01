import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { DecisionRepository } from './decision.repository';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('decisions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'analista', 'gestor', 'supervisor')
export class DecisionController {
  constructor(private readonly decisionRepository: DecisionRepository) {}

  @Get()
  findAll(@Query() query: any) {
    return this.decisionRepository.findAll(query);
  }

  @Get('credit/:creditId')
  findByCredit(@Param('creditId') creditId: string) {
    return this.decisionRepository.findByCreditId(creditId);
  }
}
