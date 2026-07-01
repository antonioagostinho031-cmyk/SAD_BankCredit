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
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, ValidateDocumentDto } from './dto/upload-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: any,
    @Body() uploadDto: UploadDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.uploadDocument(file, uploadDto, user.id);
  }

  @Get()
  @Roles('admin', 'analista', 'gestor', 'supervisor')
  findAll(@Query() query: any) {
    return this.documentsService.findAll(query);
  }

  @Get('client/:clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.documentsService.findByClientId(clientId);
  }

  @Get('client/:clientId/summary')
  getClientSummary(@Param('clientId') clientId: string) {
    return this.documentsService.getClientDocumentsSummary(clientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/url')
  getDocumentUrl(@Param('id') id: string) {
    return this.documentsService.getDocumentUrl(id);
  }

  @Get(':id/validations')
  getValidations(@Param('id') id: string) {
    return this.documentsService.getDocumentValidations(id);
  }

  @Patch(':id/validate')
  @Roles('admin', 'analista')
  validateDocument(
    @Param('id') id: string,
    @Body() validateDto: ValidateDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.validateDocument(
      id,
      validateDto.status,
      user.id,
      validateDto.validation_notes,
    );
  }

  @Delete(':id')
  @Roles('admin', 'analista')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.documentsService.remove(id, user.id);
  }
}
