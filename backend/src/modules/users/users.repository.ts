import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(private supabase: SupabaseService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert([
        {
          name: createUserDto.name,
          email: createUserDto.email,
          password: createUserDto.password,
          role: createUserDto.role || 'cliente',
          active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findOne(id: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findByEmail(email: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return data;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updateUserDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.from('users').delete().eq('id', id);

    if (error) throw error;
  }
}
