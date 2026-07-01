import {
  Controller, Get, Post, Body, Patch, Param,
  UseGuards, Query,
} from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreateCreditRequestDto, SimulateCreditDto } from './dto/create-credit-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('credit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  @Post()
  @Roles('cliente', 'admin', 'analista', 'gestor')
  create(@Body() dto: CreateCreditRequestDto, @CurrentUser() user: any) {
    return this.creditService.create(dto, user.id, user.role);
  }

  @Post('simulate')
  @Roles('admin', 'analista', 'gestor', 'supervisor', 'cliente')
  simulate(@Body() dto: SimulateCreditDto) {
    return this.creditService.simulate(dto);
  }

  @Get()
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  findAll(@Query() query: any, @CurrentUser() user: any) {
    if (user.role === 'gestor') query.managerId = user.id;
    return this.creditService.findAll(query);
  }

  @Get('my-requests')
  @Roles('cliente')
  getMyRequests(@CurrentUser() user: any) {
    return this.creditService.findMyRequests(user.id);
  }

  @Get('my-requests/:id/details')
  @Roles('cliente')
  getMyRequestDetails(@Param('id') id: string, @CurrentUser() user: any) {
    return this.creditService.getRequestDetails(id, user.id);
  }

  @Get('client/:clientId')
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  findByClient(@Param('clientId') clientId: string) {
    return this.creditService.findByClientId(clientId);
  }

  @Get(':id')
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  findOne(@Param('id') id: string) {
    return this.creditService.findOne(id);
  }

  @Get(':id/analysis')
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  getAnalysis(@Param('id') id: string) {
    return this.creditService.getAnalysis(id);
  }

  @Post(':id/analyse')
  @Roles('admin', 'analista')
  analyseCredit(@Param('id') id: string, @CurrentUser() user: any) {
    return this.creditService.analyseCredit(id, user.id);
  }

  @Patch(':id/assign')
  @Roles('admin', 'gestor', 'supervisor')
  assignAnalyst(
    @Param('id') id: string,
    @Body() body: { analyst_id: string },
    @CurrentUser() user: any,
  ) {
    return this.creditService.assignAnalyst(id, body.analyst_id, user.id);
  }

  @Patch(':id/decision')
  @Roles('admin', 'gestor', 'supervisor')
  makeDecision(
    @Param('id') id: string,
    @Body()
    body: {
      decision: string;
      approved_amount?: number;
      conditions?: string;
      rejection_reason?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.creditService.makeDecision(
      id,
      body.decision,
      user.id,
      body.approved_amount,
      body.conditions,
      body.rejection_reason,
    );
  }

  @Patch(':id/cancel')
  @Roles('admin', 'gestor', 'supervisor', 'cliente')
  cancel(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.creditService.cancel(id, user.id, body.reason);
  }
}
