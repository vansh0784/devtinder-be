import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../common/entities/notification.entity';

export type ClientNotification = {
    _id: string;
    type: Notification['type'];
    message: string;
    roomId?: string;
    /** Live code-editor session UUID when type is COLLAB_INVITE */
    collabRoomId?: string;
    connectionRequestId?: string;
    read: boolean;
    createdAt: string;
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

    private createdAtToIso(raw: unknown): string {
        if (raw instanceof Date) return raw.toISOString();
        if (typeof raw === 'string' && raw.length > 0) {
            const d = new Date(raw);
            return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        }
        if (raw != null && (typeof raw === 'number' || typeof raw === 'object')) {
            const d = new Date(raw as never);
            return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        }
        return new Date().toISOString();
    }

    private mapLeanToClient(n: any): ClientNotification {
        const sid = n.senderId;
        const senderObject = sid && typeof sid === 'object' && sid._id !== undefined;
        const cr = n.connectionRequestId;
        return {
            _id: n._id.toString(),
            type: n.type,
            message: n.message,
            roomId: n.roomId,
            collabRoomId: n.collabRoomId,
            connectionRequestId: cr !== undefined && cr !== null ? String(cr) : undefined,
            read: n.read,
            createdAt: this.createdAtToIso(n.createdAt),
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

    /** Marks incoming REQUEST banners as read — by connection doc id or legacy sender match */
    async markInboundRequestDismissed(receiverUserId: string, senderUserId: string, connectionMongoId?: string): Promise<void> {
        const rid = Types.ObjectId.isValid(receiverUserId) ? new Types.ObjectId(receiverUserId) : receiverUserId;
        const sid = Types.ObjectId.isValid(senderUserId) ? new Types.ObjectId(senderUserId) : senderUserId;
        const orClauses: object[] = [{ senderId: sid, connectionRequestId: { $exists: false } }];
        if (connectionMongoId && Types.ObjectId.isValid(connectionMongoId)) {
            orClauses.unshift({ connectionRequestId: new Types.ObjectId(connectionMongoId) });
        }

        await this.notificationModel.updateMany(
            {
                type: 'REQUEST',
                receiverId: rid,
                read: false,
                $or: orClauses,
            },
            { read: true },
        );
    }
}
