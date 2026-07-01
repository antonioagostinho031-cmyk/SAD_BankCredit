import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { CreateFTIDto } from './dto/create-fti.dto'
import { UpdateFTIDto } from './dto/update-fti.dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { CurrentUser } from '../../common/decorators/user.decorator'

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ==================== PRODUTOS ====================

  @Get()
  @Roles('admin', 'gestor', 'analista', 'supervisor', 'cliente')
  findAll(
    @Query('category') category?: string,
    @Query('active') active?: string,
  ) {
    return this.productsService.findAll(
      category,
      active === 'true' ? true : active === 'false' ? false : undefined
    )
  }

  @Get(':id')
  @Roles('admin', 'gestor', 'analista', 'supervisor', 'cliente')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id)
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.productsService.create(dto, user.id)
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.update(id, dto, user.id)
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id)
  }

  // ==================== FTIs ====================

  @Get(':productId/ftis')
  @Roles('admin', 'gestor', 'analista', 'supervisor')
  findFTIsByProduct(@Param('productId') productId: string) {
    return this.productsService.findFTIsByProduct(productId)
  }

  @Get(':productId/ftis/active')
  @Roles('admin', 'gestor', 'analista', 'supervisor', 'cliente')
  findActiveFTI(@Param('productId') productId: string) {
    return this.productsService.findActiveFTI(productId)
  }

  @Get('ftis/:id')
  @Roles('admin', 'gestor', 'analista', 'supervisor')
  findFTIById(@Param('id') id: string) {
    return this.productsService.findFTIById(id)
  }

  @Post('ftis')
  @Roles('admin')
  createFTI(@Body() dto: CreateFTIDto, @CurrentUser() user: any) {
    return this.productsService.createFTI(dto, user.id)
  }

  @Put('ftis/:id')
  @Roles('admin')
  updateFTI(
    @Param('id') id: string,
    @Body() dto: UpdateFTIDto,
    @CurrentUser() user: any,
  ) {
    return this.productsService.updateFTI(id, dto, user.id, user.role)
  }

  @Delete('ftis/:id')
  @Roles('admin')
  deleteFTI(@Param('id') id: string) {
    return this.productsService.deleteFTI(id)
  }

  @Post('ftis/:id/approve')
  @Roles('admin')
  approveFTI(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.approveFTI(id, user.id)
  }
}
