import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../common/entities/message.entity';
import { CreateMessageDto } from './create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async create(dto: CreateMessageDto) {
    const created = new this.messageModel(dto);
    return created.save();
  }

  async findByRoom(roomId: string, limit = 50) {
    return this.messageModel
      .find({ roomId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async markAsRead(messageId: string) {
    return this.messageModel.findByIdAndUpdate(messageId, { read: true }, { new: true });
  }
}
