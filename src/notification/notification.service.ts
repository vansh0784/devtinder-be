import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../common/entities/notification.entity';

export type ClientNotification = {
    _id: string;
    type: Notification['type'];
    message: string;
    roomId?: string;
    read: boolean;
    createdAt: Date;
    senderId: string;
    senderName?: string;
    senderAvatar?: string;
};

@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification.name)
        private notificationModel: Model<NotificationDocument>,
    ) {}

    async create(data: Partial<Notification>) {
        return this.notificationModel.create(data);
    }

    private mapLeanToClient(n: any): ClientNotification {
        const sid = n.senderId;
        const senderObject = sid && typeof sid === 'object' && sid._id !== undefined;
        return {
            _id: n._id.toString(),
            type: n.type,
            message: n.message,
            roomId: n.roomId,
            read: n.read,
            createdAt: n.createdAt,
            senderId: senderObject ? sid._id.toString() : String(sid),
            senderName: senderObject ? sid.username : undefined,
            senderAvatar: senderObject ? sid.avatar : undefined,
        };
    }

    /** Full shape for socket payloads and clients after a new row is inserted */
    async serializeForSocket(notificationId: string): Promise<ClientNotification | null> {
        const n = await this.notificationModel.findById(notificationId).populate('senderId', 'username avatar').lean();
        if (!n) return null;
        return this.mapLeanToClient(n);
    }

    async getUnread(userId: string) {
        const oid = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
        const list = await this.notificationModel
            .find({ receiverId: oid, read: false })
            .populate('senderId', 'username avatar')
            .sort({ createdAt: -1 })
            .lean();

        return list.map((n: any) => this.mapLeanToClient(n));
    }

    async markAsRead(id: string) {
        return this.notificationModel.findByIdAndUpdate(id, { read: true }, { new: true });
    }

    async markAllAsRead(userId: string) {
        const oid = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;
        return this.notificationModel.updateMany({ receiverId: oid, read: false }, { read: true });
    }
}
