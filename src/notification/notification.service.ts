import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Notification,
  NotificationDocument,
} from "../common/entities/notification.entity";

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(data: Partial<Notification>) {
    return this.notificationModel.create(data);
  }

  async getUnread(userId: string) {
    return this.notificationModel
      .find({ receiverId: userId, read: false })
      .sort({ createdAt: -1 })
      .lean();
  }

  async markAsRead(id: string) {
    return this.notificationModel.findByIdAndUpdate(
      id,
      { read: true },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    return this.notificationModel.updateMany(
      { receiverId: userId, read: false },
      { read: true },
    );
  }
}
