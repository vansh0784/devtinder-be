import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Server as OtServer } from 'ot';

export interface CollabRoomMember {
    userId: string;
    userName: string;
    socketIds: Set<string>;
}

export interface CollabRoom {
    roomId: string;
    createdAt: Date;
    otServer: InstanceType<typeof OtServer>;
    members: Map<string, CollabRoomMember>;
}

@Injectable()
export class CollaborationRoomService {
    private readonly logger = new Logger(CollaborationRoomService.name);
    private readonly rooms = new Map<string, CollabRoom>();

    createRoom(initialDocument = ''): CollabRoom {
        const roomId = randomUUID();
        const otServer = new OtServer(initialDocument, []);
        const room: CollabRoom = {
            roomId,
            createdAt: new Date(),
            otServer,
            members: new Map(),
        };
        this.rooms.set(roomId, room);
        this.logger.log(`Created collaboration room ${roomId}`);
        return room;
    }

    hasRoom(roomId: string): boolean {
        return this.rooms.has(roomId);
    }

    getRoom(roomId: string): CollabRoom {
        const room = this.rooms.get(roomId);
        if (!room) throw new NotFoundException(`Collaboration room ${roomId} not found`);
        return room;
    }

    tryGetRoom(roomId: string): CollabRoom | undefined {
        return this.rooms.get(roomId);
    }

    addMember(roomId: string, userId: string, userName: string, socketId: string): CollabRoom {
        const room = this.getRoom(roomId);
        let member = room.members.get(userId);
        if (!member) {
            member = { userId, userName, socketIds: new Set() };
            room.members.set(userId, member);
        }
        member.userName = userName;
        member.socketIds.add(socketId);
        return room;
    }

    removeSocket(roomId: string | undefined, socketId: string): void {
        if (!roomId) return;
        const room = this.rooms.get(roomId);
        if (!room) return;
        for (const [userId, member] of room.members) {
            member.socketIds.delete(socketId);
            if (member.socketIds.size === 0) room.members.delete(userId);
        }
    }

    getPresence(room: CollabRoom): Array<{ userId: string; userName: string }> {
        return [...room.members.values()].map((m) => ({ userId: m.userId, userName: m.userName }));
    }

    getEditorIds(room: CollabRoom): string[] {
        return [...room.members.keys()];
    }
}
