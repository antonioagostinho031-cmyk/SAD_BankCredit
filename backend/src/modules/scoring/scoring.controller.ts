import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('scoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'analista', 'gestor', 'supervisor')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Get('client/:clientId/score-history')
  getScoreHistory(@Param('clientId') clientId: string) {
    return this.scoringService['scoringRepository'].getScoreHistory(clientId);
  }

  @Get('client/:clientId/latest')
  getLatestScore(@Param('clientId') clientId: string) {
    return this.scoringService['scoringRepository'].getLatestScore(clientId);
  }
}
