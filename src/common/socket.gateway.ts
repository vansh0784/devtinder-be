import { Injectable, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/',
    transport: ['websocket'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private logger = new Logger('Socket Gateway');
    private activeUsers = new Map<string, Set<string>>();

    handleConnection(client: Socket) {
        this.logger.log(`Client connected with ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected with ${client.id}`);
        for (const [clientIds, socketIds] of this.activeUsers.entries()) {
            this.activeUsers.delete(client.id);
            if (socketIds.size == 0) this.activeUsers.delete(clientIds);
        }
    }

    @SubscribeMessage('connect')
    handleUserConnection(client: Socket, id: string) {
        if (!id) return client.emit('error', { message: 'ID is required' });
        if (!this.activeUsers.has(client.id)) this.activeUsers.set(client.id, new Set());
        this.activeUsers.get(id)!.add(id);
        this.logger.log('Client is connected');
        client.emit('connected', { id });
    }

    @SubscribeMessage('disconnect')
    handleUserDisconnection(client: Socket, id: string) {
        const socketIds = this.activeUsers.get(id);
        if (socketIds) {
            socketIds.delete(client.id);
            if (socketIds.size == 0) {
                this.activeUsers.delete(id);
            }
        }
        this.logger.log(`Client ${client.id} disconnected from application ${id}`);
        client.emit('disconnected', { id });
    }

    handleSendNotification(sender_id: string, receiver_id: string, type: string) {
        if (!sender_id && !receiver_id) return this.server.emit('error', { message: `Id's are not their, Please check it` });
        const socketIds = this.activeUsers.get(receiver_id);
        if (socketIds && socketIds.size > 0) {
            this.server.emit(`${type}-notification`, { socketIds });
        }
    }
}
