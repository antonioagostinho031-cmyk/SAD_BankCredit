import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { Document, DocumentValidation } from './entities/document.entity';

@Injectable()
export class DocumentsRepository {
  constructor(private supabase: SupabaseService) {}

  async create(documentData: any): Promise<Document> {
    const { data, error } = await this.supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(filters?: any): Promise<Document[]> {
    let query = this.supabase
      .from('documents')
      .select('*, clients(full_name)')
      .order('uploaded_at', { ascending: false });

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.document_type) {
      query = query.eq('document_type', filters.document_type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async findOne(id: string): Promise<Document> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findByClientId(clientId: string): Promise<Document[]> {
    const { data, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async update(id: string, updateData: any): Promise<Document> {
    const { data, error } = await this.supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStatus(
    id: string,
    status: string,
    validatedBy?: string,
    notes?: string,
  ): Promise<Document> {
    const updateData: any = {
      status,
      validated_at: new Date().toISOString(),
    };

    if (validatedBy) updateData.validated_by = validatedBy;
    if (notes) updateData.validation_notes = notes;

    return this.update(id, updateData);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('documents').delete().eq('id', id);

    if (error) throw error;
  }

  async createValidation(validationData: any): Promise<DocumentValidation> {
    const { data, error } = await this.supabase
      .from('document_validations')
      .insert([validationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findValidationsByDocumentId(documentId: string): Promise<DocumentValidation[]> {
    const { data, error } = await this.supabase
      .from('document_validations')
      .select('*')
      .eq('document_id', documentId)
      .order('validation_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  async uploadFile(file: any, path: string): Promise<string> {
    const { data, error } = await this.supabase
      .getStorage('documents')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data.path;
  }

  async getFileUrl(path: string): Promise<string> {
    const { data } = this.supabase.getStorage('documents').getPublicUrl(path);
    return data.publicUrl;
  }

  async deleteFile(path: string): Promise<void> {
    const { error } = await this.supabase.getStorage('documents').remove([path]);

    if (error) throw error;
  }
}
