import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class DecisionRepository {
  constructor(private supabase: SupabaseService) {}

  async saveDecision(decisionData: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('decision_logs')
      .insert([decisionData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao guardar decisão:', error);
      return null;
    }
    return data;
  }

  async findByCreditId(creditId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('decision_logs')
      .select('*')
      .eq('credit_request_id', creditId)
      .order('decided_at', { ascending: false });

    if (error) return [];
    return data;
  }

  async findAll(filters?: any): Promise<any[]> {
    let query = this.supabase
      .from('decision_logs')
      .select('*')
      .order('decided_at', { ascending: false });

    if (filters?.recommendation) {
      query = query.eq('recommendation', filters.recommendation);
    }

    const { data, error } = await query;
    if (error) return [];
    return data;
  }
}
