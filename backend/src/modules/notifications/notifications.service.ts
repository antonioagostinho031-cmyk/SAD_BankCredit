import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private notificationsRepository: NotificationsRepository) {}

  async send(data: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    entity_id?: string;
  }) {
    try {
      return await this.notificationsRepository.create({
        ...data,
        read: false,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  }

  async getByUser(userId: string) {
    return this.notificationsRepository.findByUserId(userId);
  }

  async markAsRead(id: string) {
    return this.notificationsRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    return this.notificationsRepository.markAllAsRead(userId);
  }

  async countUnread(userId: string) {
    return this.notificationsRepository.countUnread(userId);
  }
}
