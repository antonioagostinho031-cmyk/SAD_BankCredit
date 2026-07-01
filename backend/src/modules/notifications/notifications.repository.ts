import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class NotificationsRepository {
  constructor(private supabase: SupabaseService) {}

  async create(data: any): Promise<any> {
    const { data: result, error } = await this.supabase
      .from('notifications')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async findByUserId(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data;
  }

  async markAsRead(id: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  }

  async countUnread(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) return 0;
    return count || 0;
  }
}
