import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto) {
    return this.usersRepository.create(createUserDto);
  }

  async findAll() {
    return this.usersRepository.findAll();
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne(id);
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    return this.usersRepository.update(id, updateUserDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.usersRepository.remove(id);
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    return this.update(id, { active: !user.active });
  }
}
