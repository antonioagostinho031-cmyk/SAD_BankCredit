import { Injectable } from '@nestjs/common'
import { SupabaseService } from '../../database/supabase.service'
import { CreditProduct, CreditProductFTI } from './entities/credit-product.entity'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { CreateFTIDto } from './dto/create-fti.dto'
import { UpdateFTIDto } from './dto/update-fti.dto'

@Injectable()
export class ProductsRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  // ==================== PRODUTOS ====================
  
  async findAllProducts(filters?: { category?: string; active?: boolean }): Promise<CreditProduct[]> {
    let query = this.supabaseService.getClient().from('credit_products').select('*').order('priority_order', { ascending: true })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async findProductById(id: string): Promise<CreditProduct | null> {
    const { data, error } = await this.supabaseService.getClient()
      .from('credit_products')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  async createProduct(dto: CreateProductDto, userId: string): Promise<CreditProduct> {
    const { data, error } = await this.supabaseService.getClient()
      .from('credit_products')
      .insert({ ...dto, created_by: userId, updated_by: userId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateProduct(id: string, dto: UpdateProductDto, userId: string): Promise<CreditProduct> {
    const { data, error } = await this.supabaseService.getClient()
      .from('credit_products')
      .update({ ...dto, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('credit_products')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ==================== FTIs ====================
  
  async findFTIsByProduct(productId: string): Promise<CreditProductFTI[]> {
    const { data, error } = await this.supabaseService.getClient()
      .from('credit_product_ftis')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async findActiveFTI(productId: string): Promise<CreditProductFTI | null> {
    const { data, error } = await this.supabaseService.getClient()
      .from('credit_product_ftis')
      .select('*')
      .eq('product_id', productId)
      .eq('active', true)
      .single()

    if (error) return null
    return data
  }

  async findFTIById(id: string): Promise<CreditProductFTI | null> {
    const { data, error } = await this.supabaseService.getClient()
      .from('credit_product_ftis')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  async createFTI(dto: CreateFTIDto, userId: string): Promise<CreditProductFTI> {
    const { data, error} = await this.supabaseService.getClient()
      .from('credit_product_ftis')
      .insert({ ...dto, created_by: userId, updated_by: userId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateFTI(id: string, dto: UpdateFTIDto, userId: string): Promise<CreditProductFTI> {
    const { data, error } = await this.supabaseService.getClient()
      .from('credit_product_ftis')
      .update({ ...dto, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteFTI(id: string): Promise<void> {
    const { error } = await this.supabaseService.getClient()
      .from('credit_product_ftis')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async approveFTI(id: string, userId: string): Promise<CreditProductFTI> {
    const { data, error } = await this.supabaseService.getClient()
      .from('credit_product_ftis')
      .update({ 
        approved: true, 
        approved_by: userId, 
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
