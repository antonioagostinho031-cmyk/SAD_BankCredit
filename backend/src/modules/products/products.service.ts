import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { ProductsRepository } from './products.repository'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { CreateFTIDto } from './dto/create-fti.dto'
import { UpdateFTIDto } from './dto/update-fti.dto'

@Injectable()
export class ProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  // ==================== PRODUTOS ====================
  
  async findAll(category?: string, active?: boolean) {
    return this.repository.findAllProducts({ category, active })
  }

  async findOne(id: string) {
    const product = await this.repository.findProductById(id)
    if (!product) {
      throw new NotFoundException('Produto não encontrado')
    }
    return product
  }

  async create(dto: CreateProductDto, userId: string) {
    return this.repository.createProduct(dto, userId)
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    await this.findOne(id)
    return this.repository.updateProduct(id, dto, userId)
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.repository.deleteProduct(id)
  }

  // ==================== FTIs ====================
  
  async findFTIsByProduct(productId: string) {
    await this.findOne(productId)
    return this.repository.findFTIsByProduct(productId)
  }

  async findActiveFTI(productId: string) {
    await this.findOne(productId)
    const fti = await this.repository.findActiveFTI(productId)
    if (!fti) {
      throw new NotFoundException('FTI ativa não encontrada para este produto')
    }
    return fti
  }

  async findFTIById(id: string) {
    const fti = await this.repository.findFTIById(id)
    if (!fti) {
      throw new NotFoundException('FTI não encontrada')
    }
    return fti
  }

  async createFTI(dto: CreateFTIDto, userId: string) {
    await this.findOne(dto.product_id)
    return this.repository.createFTI(dto, userId)
  }

  async updateFTI(id: string, dto: UpdateFTIDto, userId: string, userRole: string) {
    const fti = await this.findFTIById(id)
    
    // Apenas admin pode editar FTI aprovada
    if (fti.approved && userRole !== 'admin') {
      throw new ForbiddenException('Apenas administradores podem editar FTIs aprovadas')
    }
    
    return this.repository.updateFTI(id, dto, userId)
  }

  async deleteFTI(id: string) {
    await this.findFTIById(id)
    return this.repository.deleteFTI(id)
  }

  async approveFTI(id: string, userId: string) {
    await this.findFTIById(id)
    return this.repository.approveFTI(id, userId)
  }
}
