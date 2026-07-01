import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ClientsService } from './clients.service';
import { ClientsFinancialService } from './clients-financial.service';
import { ClientsUpdateSimpleService } from './clients-update-simple.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { UpdateDataRequestDto } from './dto/update-data-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import * as path from 'path';
import * as fs from 'fs';

// Configuração de upload
const uploadStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'update-requests');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly clientsFinancialService: ClientsFinancialService,
    private readonly clientsUpdateService: ClientsUpdateSimpleService,
  ) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto, @CurrentUser() user: any) {
    if (user.role === 'cliente') {
      createClientDto.user_id = user.id;
    }
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  findAll(@Query() query: any, @CurrentUser() user: any) {
    if (user.role === 'gestor') query.account_manager_id = user.id;
    return this.clientsService.findAll(query);
  }

  @Get('my-profile')
  @Roles('cliente', 'admin', 'analista', 'gestor', 'supervisor')
  getMyProfile(@CurrentUser() user: any) {
    return this.clientsService.findByUserId(user.id);
  }

  @Get('my-account-status')
  @Roles('cliente', 'admin', 'analista', 'gestor', 'supervisor')
  async getMyAccountStatus(@CurrentUser() user: any) {
    const client = await this.clientsService.findByUserId(user.id);
    if (!client) {
      return { has_updated_account: false, missing_identity: true, missing_employer: true, client: null };
    }
    const status = await this.clientsService.getAccountUpdateStatus((client as any).id);
    return { ...status, client };
  }

  @Get('my-update-requests')
  @Roles('cliente', 'admin', 'analista', 'gestor', 'supervisor')
  async getMyUpdateRequests(@CurrentUser() user: any, @Query('status') status?: string) {
    try {
      const client = await this.clientsService.findByUserId(user.id);
      if (!client) return [];
      // passa clientId como 4.º argumento para filtrar apenas pedidos deste cliente
      return await this.clientsUpdateService.getUpdateRequests(user.id, user.role, status, client.id);
    } catch (error) {
      console.error('❌ Error in getMyUpdateRequests:', error);
      return [];
    }
  }

  // ==================== ATUALIZAÇÃO DE DADOS ====================
  // IMPORTANTE: estas rotas estáticas devem ficar ANTES de @Get(':id')
  // para evitar conflito de matching no NestJS

  @Post('update-request')
  @Roles('cliente', 'admin', 'analista')
  @UseInterceptors(FilesInterceptor('documents', 5, { storage: uploadStorage }))
  async createUpdateRequest(
    @CurrentUser() user: any,
    @Body() dto: UpdateDataRequestDto,
    @UploadedFiles() documents: Express.Multer.File[],
  ) {
    try {
      const client = await this.clientsService.findByUserId(user.id);
      if (!client) {
        throw new BadRequestException('Cliente não encontrado. Por favor, complete seu cadastro primeiro.');
      }
      return await this.clientsUpdateService.createUpdateRequest(client.id, dto, documents);
    } catch (error) {
      console.error('❌ Error creating update request:', error);
      throw error;
    }
  }

  @Get('update-requests')
  @Roles('admin', 'gestor')
  async getAllUpdateRequests(
    @Query('status') status?: string,
    @CurrentUser() user?: any,
  ) {
    return this.clientsUpdateService.getUpdateRequests(user.id, user.role, status);
  }

  @Get('update-request/:requestId/documents/:filename')
  @Roles('admin', 'gestor')
  async serveUpdateDocument(
    @Param('requestId') requestId: string,
    @Param('filename') filename: string,
    @Query('dl') dl: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const doc = await this.clientsUpdateService.getDocumentInfo(requestId, filename);

    if (!fs.existsSync(doc.path)) {
      throw new NotFoundException('Ficheiro não encontrado no servidor');
    }

    const mime = doc.mimetype || 'application/octet-stream';
    const encoded = encodeURIComponent(doc.originalName);
    res.setHeader('Content-Type', mime);
    res.setHeader(
      'Content-Disposition',
      dl === '1'
        ? `attachment; filename*=UTF-8''${encoded}`
        : `inline; filename*=UTF-8''${encoded}`,
    );

    return new StreamableFile(fs.createReadStream(doc.path));
  }

  @Get('update-request/:id')
  @Roles('cliente', 'admin', 'analista', 'gestor')
  async getUpdateRequest(@Param('id') id: string, @CurrentUser() user: any) {
    const request = await this.clientsUpdateService.getUpdateRequest(id);
    if (user.role !== 'admin' && user.role !== 'gestor') {
      const client = await this.clientsService.findByUserId(user.id);
      if (!client || request.client_id !== client.id) {
        throw new ForbiddenException('Não autorizado');
      }
    }
    return request;
  }

  @Patch('update-request/:id/approve')
  @Roles('gestor')
  async approveUpdateRequest(@Param('id') id: string, @CurrentUser() user: any) {
    return this.clientsUpdateService.approveUpdateRequest(id, user.id);
  }

  @Patch('update-request/:id/reject')
  @Roles('gestor')
  async rejectUpdateRequest(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: any,
  ) {
    return this.clientsUpdateService.rejectUpdateRequest(id, body.reason, user.id);
  }

  // ==================== ROTAS COM PARÂMETRO :id ====================
  // Estas rotas ficam DEPOIS das estáticas para evitar conflitos

  @Get(':id/account-status')
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  async getClientAccountStatus(@Param('id') id: string) {
    return this.clientsService.getAccountUpdateStatus(id);
  }

  @Get(':id/financial-metrics')
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  getFinancialMetrics(@Param('id') id: string) {
    return this.clientsFinancialService.getFinancialMetrics(id);
  }

  @Get(':id/transactions')
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  getTransactionHistory(@Param('id') id: string, @Query('months') months?: string) {
    const monthsNum = months ? parseInt(months, 10) : 6;
    return this.clientsFinancialService.getTransactionHistory(id, monthsNum);
  }

  @Get(':id/stats')
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  getStats(@Param('id') id: string) {
    return this.clientsService.getClientStats(id);
  }

  @Get(':id/eligibility-check')
  @Roles('admin', 'analista', 'gestor', 'supervisor', 'cliente')
  evaluateEligibility(@Param('id') id: string) {
    return this.clientsService.evaluateEligibility(id);
  }

  @Get(':id')
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Patch(':id/assign-manager')
  @Roles('admin')
  assignManager(
    @Param('id') id: string,
    @Body() body: { account_manager_id: string | null },
  ) {
    return this.clientsService.update(id, { account_manager_id: body.account_manager_id ?? undefined });
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Patch(':id/eligibility')
  @Roles('admin', 'analista', 'gestor')
  updateEligibility(@Param('id') id: string, @Body() body: { is_eligible: boolean }) {
    return this.clientsService.updateEligibility(id, body.is_eligible);
  }

  @Patch(':id/registration-status')
  @Roles('admin', 'analista')
  updateRegistrationStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.clientsService.updateRegistrationStatus(id, body.status);
  }
}
