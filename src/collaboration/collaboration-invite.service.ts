import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { NotificationService } from '../notification/notification.service';
import { SocketGateway } from '../common/socket.gateway';
import { ConnectionService } from '../connection/connect.service';
import { CollaborationRoomService } from './collaboration-room.service';
import type { BaseResponse } from '../common/dto';

@Injectable()
export class CollaborationInviteService {
    private readonly logger = new Logger(CollaborationInviteService.name);

    constructor(
        private readonly rooms: CollaborationRoomService,
        private readonly connectionService: ConnectionService,
        private readonly notificationService: NotificationService,
        private readonly socketGateway: SocketGateway,
    ) {}

    async sendInvite(senderUserId: string, collabRoomId: string, receiverUserId: string): Promise<BaseResponse> {
        const sidRaw = `${senderUserId ?? ''}`.trim();
        const ridRaw = `${receiverUserId ?? ''}`.trim();
        const roomRaw = `${collabRoomId ?? ''}`.trim();

        if (!sidRaw || !ridRaw || !roomRaw) {
            throw new BadRequestException('Missing sender, receiver, or session id');
        }
        if (sidRaw === ridRaw) {
            throw new BadRequestException(`You can't invite yourself`);
        }
        if (!Types.ObjectId.isValid(sidRaw)) {
            throw new BadRequestException('Invalid sender account id');
        }
        if (!Types.ObjectId.isValid(ridRaw)) {
            throw new BadRequestException('Invalid receiver id');
        }

        const sid = new Types.ObjectId(sidRaw);
        const rid = new Types.ObjectId(ridRaw);

        if (!this.rooms.hasRoom(roomRaw)) {
            throw new NotFoundException('Collaboration session not found — start Live Collaboration again');
        }

        const matched = await this.connectionService.areMatchedFriends(sidRaw, ridRaw);
        if (!matched) {
            throw new ForbiddenException('You can only invite developers you matched with');
        }

        try {
            const created = await this.notificationService.create({
                receiverId: rid,
                senderId: sid,
                type: 'COLLAB_INVITE',
                collabRoomId: roomRaw,
                message: 'invited you to a live coding session — open to join',
                read: false,
            });

            const payload = await this.notificationService.serializeForSocket(
                typeof created === 'object' && created !== null && '_id' in created
                    ? (created._id as { toString(): string }).toString()
                    : String(created),
            );
            if (payload) {
                this.socketGateway.emitNotificationToUser(
                    ridRaw,
                    payload as unknown as Record<string, unknown>,
                );
            } else {
                this.logger.warn(
                    `Collaboration invite row saved (${String(created?._id ?? '')}) but socket payload serialization returned null`,
                );
            }

            this.logger.log(`Collaboration invite room=${roomRaw} from=${sidRaw} to=${ridRaw}`);
            return { statusCode: 200, message: 'Invitation sent' };
        } catch (e: unknown) {
            if (e instanceof HttpException) {
                throw e;
            }
            const err = e as Error & { name?: string; code?: number };
            this.logger.error(
                `Failed to persist or emit COLLAB_INVITE (${err.message})`,
                err.stack,
            );
            if (
                typeof err.code === 'number' &&
                (err.code === 11000 || err.name === 'ValidationError')
            ) {
                throw new BadRequestException(err.message ?? 'Invalid notification payload');
            }
            throw new InternalServerErrorException('Could not create collaboration invite notification');
        }
    }
}
