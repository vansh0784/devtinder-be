import { Logger } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TextOperation } from 'ot';
import { CollaborationRoomService } from './collaboration-room.service';

type JoinRoomPayload = { roomId: string; userId: string; userName: string };
type OtSubmitPayload = { roomId: string; revision: number; op: (string | number)[] };

@WebSocketGateway({
    namespace: '/code-editor',
    cors: { origin: '*', credentials: true },
    transports: ['websocket', 'polling'],
})
export class CodeEditorCollabGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(CodeEditorCollabGateway.name);
    /** socket.id -> roomId for cleanup */
    private readonly socketRoom = new Map<string, string>();

    constructor(private readonly rooms: CollaborationRoomService) {}

    handleDisconnect(client: Socket) {
        const roomId = this.socketRoom.get(client.id);
        this.socketRoom.delete(client.id);
        this.rooms.removeSocket(roomId, client.id);
        if (roomId) {
            const room = this.rooms.tryGetRoom(roomId);
            if (room) {
                this.server.to(`room:${roomId}`).emit('presence', { users: this.rooms.getPresence(room) });
                this.server.to(`room:${roomId}`).emit('permission-update', { editors: this.rooms.getEditorIds(room) });
            }
        }
    }

    @SubscribeMessage('join-room')
    handleJoin(@ConnectedSocket() client: Socket, @MessageBody() body: JoinRoomPayload) {
        if (!body?.roomId || !body?.userId) {
            client.emit('collab-error', { code: 'INVALID_PAYLOAD', message: 'roomId and userId are required' });
            return;
        }
        if (!this.rooms.hasRoom(body.roomId)) {
            client.emit('collab-error', { code: 'ROOM_NOT_FOUND', message: 'Session does not exist or expired' });
            return;
        }
        const prev = this.socketRoom.get(client.id);
        if (prev && prev !== body.roomId) {
            client.leave(`room:${prev}`);
            this.rooms.removeSocket(prev, client.id);
        }
        client.join(`room:${body.roomId}`);
        this.socketRoom.set(client.id, body.roomId);
        const room = this.rooms.addMember(body.roomId, body.userId, body.userName || 'Guest', client.id);

        const otRevision = room.otServer.operations.length;
        client.emit('collab-handshake', {
            roomId: body.roomId,
            otRevision,
            otDocument: room.otServer.document,
        });

        this.server.to(`room:${body.roomId}`).emit('presence', { users: this.rooms.getPresence(room) });
        const editors = this.rooms.getEditorIds(room);
        this.server.to(`room:${body.roomId}`).emit('permission-update', { editors });
        client.emit('permission-update', { editors });

        this.logger.log(`Socket ${client.id} joined room ${body.roomId}`);
    }

    /**
     * Operational Transformation (OT) channel: server transforms concurrent text ops
     * (ot.js) while Monaco stays bound to Yjs (CRDT) for the live buffer.
     */
    @SubscribeMessage('ot-submit')
    handleOtSubmit(@ConnectedSocket() client: Socket, @MessageBody() body: OtSubmitPayload) {
        if (!body?.roomId || !Array.isArray(body.op)) {
            client.emit('collab-error', { code: 'INVALID_OT', message: 'Invalid OT payload' });
            return;
        }
        const room = this.rooms.tryGetRoom(body.roomId);
        if (!room) {
            client.emit('collab-error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
            return;
        }
        if (!client.rooms.has(`room:${body.roomId}`)) {
            client.emit('collab-error', { code: 'NOT_IN_ROOM', message: 'Join the room first' });
            return;
        }

        let op: InstanceType<typeof TextOperation>;
        try {
            op = TextOperation.fromJSON(body.op);
        } catch (e) {
            this.logger.warn(`OT fromJSON failed: ${(e as Error).message}`);
            client.emit('collab-error', { code: 'INVALID_OT', message: 'Malformed operation' });
            return;
        }

        try {
            const transformed = room.otServer.receiveOperation(body.revision, op);
            const newRevision = room.otServer.operations.length;
            client.emit('ot-ack', { revision: newRevision });
            client.to(`room:${body.roomId}`).emit('ot-applied', {
                revision: newRevision,
                op: transformed.toJSON(),
                sourceSocketId: client.id,
            });
        } catch (e) {
            this.logger.warn(`OT receiveOperation failed: ${(e as Error).message}`);
            client.emit('ot-resync', {
                document: room.otServer.document,
                revision: room.otServer.operations.length,
            });
        }
    }
}
