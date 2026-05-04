import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from '../message/message.service';
import { NotificationService } from '../notification/notification.service';

const userRoom = (userId: string) => `user:${userId}`;
const chatRoom = (roomId: string) => `chat:${roomId}`;

@Injectable()
@WebSocketGateway({
    cors: { origin: '*', credentials: false },
    namespace: '/',
    transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private logger = new Logger('SocketGateway');
    /** Tracks register_user → required for messaging */
    private readonly socketUserId = new Map<string, string>();

    constructor(
        @Inject(forwardRef(() => MessagesService))
        private readonly messagesService: MessagesService,
        private readonly notificationService: NotificationService,
    ) {}

    handleConnection(client: Socket) {
        this.logger.log(`Socket connected ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.socketUserId.delete(client.id);
        this.logger.log(`Socket disconnected ${client.id}`);
    }

    @SubscribeMessage('register_user')
    handleRegister(client: Socket, userId: string) {
        if (!userId || typeof userId !== 'string') {
            client.emit('register_error', { message: 'userId string required' });
            return;
        }
        void client.join(userRoom(userId));
        this.socketUserId.set(client.id, userId);
        this.logger.verbose(`socket ${client.id} → ${userRoom(userId)}`);
        client.emit('registered', { userId });
    }

    @SubscribeMessage('join_room')
    handleJoinRoom(client: Socket, payload: { roomId?: string; userId?: string }) {
        const bound = this.socketUserId.get(client.id);
        if (!bound) {
            client.emit('chat_error', { message: 'Call register_user after connecting' });
            return;
        }

        const roomId = payload?.roomId;
        if (!roomId || typeof roomId !== 'string') {
            client.emit('chat_error', { message: 'roomId required' });
            return;
        }

        if (payload?.userId && payload.userId !== bound) {
            client.emit('chat_error', { message: 'userId does not match session' });
            return;
        }

        if (!this.isRoomParticipant(roomId, bound)) {
            client.emit('chat_error', { message: 'Not a participant in this room' });
            return;
        }

        void client.join(chatRoom(roomId));
        void client.join(userRoom(bound));
        this.logger.verbose(`socket ${client.id} → ${chatRoom(roomId)}`);
        client.emit('joined_room', { roomId });
    }

    @SubscribeMessage('leave_room')
    handleLeaveRoom(client: Socket, payload: { roomId?: string }) {
        const roomId = payload?.roomId;
        if (roomId && typeof roomId === 'string') {
            void client.leave(chatRoom(roomId));
        }
    }

    @SubscribeMessage('load_messages')
    async handleLoadMessages(client: Socket, payload: { roomId?: string; limit?: number }) {
        const bound = this.socketUserId.get(client.id);
        if (!bound) {
            client.emit('chat_error', { message: 'Call register_user after connecting' });
            return;
        }

        const roomId = payload?.roomId;
        if (!roomId || typeof roomId !== 'string') {
            client.emit('chat_error', { message: 'roomId required' });
            return;
        }

        if (!this.isRoomParticipant(roomId, bound)) {
            client.emit('chat_error', { message: 'Not a participant in this room' });
            return;
        }

        const limit = typeof payload.limit === 'number' && payload.limit > 0 ? Math.min(payload.limit, 500) : 100;

        try {
            const list = await this.messagesService.findByRoom(roomId, limit);
            const mapped = list.map((m: Record<string, unknown>) => this.toClientMessageLean(m));
            client.emit('chat_history', mapped);
        } catch (err) {
            this.logger.error(`load_messages ${roomId}`, err);
            client.emit('chat_error', { message: 'Failed to load messages' });
        }
    }

    @SubscribeMessage('send_message')
    async handleSendMessage(client: Socket, payload: Record<string, unknown>) {
        const bound = this.socketUserId.get(client.id);
        if (!bound) {
            client.emit('chat_error', { message: 'Call register_user after connecting' });
            return;
        }

        const roomId = payload?.roomId;
        const senderId = payload?.senderId;
        const receiverId = payload?.receiverId;
        const contentRaw = payload?.content;
        const content =
            typeof contentRaw === 'string'
                ? contentRaw.trim()
                : typeof contentRaw === 'number'
                  ? String(contentRaw).trim()
                  : '';

        if (
            typeof roomId !== 'string' ||
            typeof senderId !== 'string' ||
            typeof receiverId !== 'string' ||
            !content.length
        ) {
            client.emit('chat_error', { message: 'Invalid message payload' });
            return;
        }

        if (bound !== senderId) {
            client.emit('chat_error', { message: 'Cannot send as another user' });
            return;
        }

        const parts = roomId.split('_').filter(Boolean);
        if (
            parts.length !== 2 ||
            !parts.includes(senderId) ||
            !parts.includes(receiverId) ||
            senderId === receiverId
        ) {
            client.emit('chat_error', { message: 'Invalid room or participants' });
            return;
        }

        try {
            const doc = await this.messagesService.create({
                roomId,
                senderId,
                receiverId,
                content,
                read: false,
            });

            const outbound = this.toClientMessageDoc(doc);

            this.server.to(chatRoom(roomId)).emit('receive_message', outbound);

            const preview =
                content.length > 100 ? `${content.slice(0, 100)}…` : content;
            const notification = await this.notificationService.create({
                receiverId: receiverId as any,
                senderId: senderId as any,
                type: 'MESSAGE',
                roomId,
                message: preview,
                read: false,
            });
            const nPayload = await this.notificationService.serializeForSocket(notification._id.toString());
            if (nPayload) {
                this.emitNotificationToUser(receiverId, nPayload as unknown as Record<string, unknown>);
            }
        } catch (err) {
            this.logger.error('send_message', err);
            client.emit('chat_error', { message: 'Failed to send message' });
        }
    }

    emitNotificationToUser(receiverUserId: string, payload: Record<string, unknown>) {
        this.server.to(userRoom(receiverUserId)).emit('notification', payload);
    }

    private isRoomParticipant(roomId: string, userId: string): boolean {
        const parts = roomId.split('_').filter(Boolean);
        return parts.length === 2 && parts.includes(userId);
    }

    private toClientMessageDoc(doc: {
        _id?: { toString: () => string };
        roomId: string;
        senderId: string;
        receiverId: string;
        content: string;
        read?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
    }) {
        const oid = doc._id;
        return {
            _id: oid ? oid.toString() : '',
            roomId: doc.roomId,
            senderId: String(doc.senderId),
            receiverId: String(doc.receiverId),
            content: doc.content,
            read: Boolean(doc.read),
            createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
        };
    }

    private toClientMessageLean(m: Record<string, unknown>) {
        const id = m._id as { toString: () => string } | undefined;
        return {
            _id: id ? id.toString() : '',
            roomId: String(m.roomId),
            senderId: String(m.senderId),
            receiverId: String(m.receiverId),
            content: String(m.content ?? ''),
            read: Boolean(m.read),
            createdAt: (m.createdAt ? new Date(m.createdAt as string | Date).toISOString() : '') || '',
            updatedAt: m.updatedAt ? new Date(m.updatedAt as string | Date).toISOString() : undefined,
        };
    }
}
