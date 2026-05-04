import { Injectable, Logger } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/** Room name for targeting a user — client must emit `register_user` with their user id */
const userRoom = (userId: string) => `user:${userId}`;

@Injectable()
@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/',
    transport: ['websocket'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private logger = new Logger('SocketGateway');

    handleConnection(client: Socket) {
        this.logger.log(`Socket connected ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Socket disconnected ${client.id}`);
    }

    /**
     * Client should call after auth so connection requests / notifications can be pushed in real time.
     * Payload: Mongo user id string (same as JWT `user_id`).
     */
    @SubscribeMessage('register_user')
    handleRegister(client: Socket, userId: string) {
        if (!userId || typeof userId !== 'string') {
            client.emit('register_error', { message: 'userId string required' });
            return;
        }
        void client.join(userRoom(userId));
        this.logger.log(`Socket ${client.id} joined room ${userRoom(userId)}`);
        client.emit('registered', { userId });
    }

    /** Deliver a notification shape compatible with GET /notifications/unread list items */
    emitNotificationToUser(receiverUserId: string, payload: Record<string, unknown>) {
        this.server.to(userRoom(receiverUserId)).emit('notification', payload);
    }
}
