import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseResponse } from '../common/dto';
import { Connection, ConnectionStatus } from '../common/entities/connection.entity';
import { User } from '../common/entities/user.entity';
import { NotificationService } from '../notification/notification.service';
import { SocketGateway } from '../common/socket.gateway';

@Injectable()
export class ConnectionService {
    constructor(
        @InjectModel(Connection.name)
        private connectModel: Model<Connection>,
        @InjectModel(User.name)
        private userModel: Model<User>,
        private readonly notificationService: NotificationService,
        private readonly socketGateway: SocketGateway,
    ) {}

    async interested(senderId: string, receiverId: string): Promise<BaseResponse> {
        if (senderId === receiverId) {
            throw new BadRequestException(`You can't send invitation to yourself`);
        }

        const reverseConnection = await this.connectModel.findOne({
            userA: receiverId,
            userB: senderId,
            status: ConnectionStatus.PENDING,
        });

        if (reverseConnection) {
            reverseConnection.status = ConnectionStatus.ACCEPTED;
            await reverseConnection.save();
            await this.persistAndEmitMutualMatch(senderId, receiverId);
            return { statusCode: 200, message: "It's a Match 🎉" };
        }

        const existing_connection = await this.connectModel.findOne({
            $or: [
                { userA: senderId, userB: receiverId },
                { userA: receiverId, userB: senderId },
            ],
        });

        if (existing_connection) {
            throw new BadRequestException('Already swiped or connected');
        }

        await this.connectModel.create({
            userA: senderId,
            userB: receiverId,
            status: ConnectionStatus.PENDING,
        });

        await this.persistAndEmitConnectionRequest(senderId, receiverId);
        return { statusCode: 200, message: 'Right swipe sent successfully 👍' };
    }

    async notInterested(senderId: string, receiverId: string): Promise<BaseResponse> {
        if (senderId === receiverId) {
            throw new BadRequestException(`You can't reject yourself`);
        }

        const existing_connection = await this.connectModel.findOne({
            $or: [
                { userA: senderId, userB: receiverId },
                { userA: receiverId, userB: senderId },
            ],
        });

        if (existing_connection) {
            throw new BadRequestException('Already swiped or connected');
        }

        await this.connectModel.create({
            userA: senderId,
            userB: receiverId,
            status: ConnectionStatus.REJECTED,
        });

        return { statusCode: 200, message: 'Left swipe recorded 👎' };
    }

    async acceptRequest(requestId: string, currentUserId: string): Promise<BaseResponse> {
        const connectionRequest = await this.connectModel.findById(requestId);

        if (!connectionRequest) {
            throw new NotFoundException('No connection request found');
        }

        if (connectionRequest.status !== ConnectionStatus.PENDING) {
            throw new BadRequestException('Request not pending');
        }

        if (connectionRequest.userB.toString() !== currentUserId) {
            throw new BadRequestException('Not Authorized');
        }

        connectionRequest.status = ConnectionStatus.ACCEPTED;
        await connectionRequest.save();

        const senderId = connectionRequest.userA.toString();
        const accepterId = connectionRequest.userB.toString();
        await this.persistAndEmitResponse(senderId, accepterId, 'REQUEST_ACCEPTED', 'accepted your connection request');

        return { statusCode: 200, message: 'Request accepted successfully!!' };
    }

    async rejectRequest(requestId: string, currentUserId: string): Promise<BaseResponse> {
        const connectionRequest = await this.connectModel.findById(requestId);

        if (!connectionRequest) {
            throw new NotFoundException('No connection request found');
        }

        if (connectionRequest.status !== ConnectionStatus.PENDING) {
            throw new BadRequestException('Request not pending');
        }

        if (connectionRequest.userB.toString() !== currentUserId) {
            throw new BadRequestException('Not Authorized');
        }

        connectionRequest.status = ConnectionStatus.REJECTED;
        await connectionRequest.save();

        const senderId = connectionRequest.userA.toString();
        const rejectorId = connectionRequest.userB.toString();
        await this.persistAndEmitResponse(senderId, rejectorId, 'REQUEST_REJECTED', 'declined your connection request');

        return { statusCode: 200, message: 'Request rejected successfully!!' };
    }

    async getPendingRequest(userId: string): Promise<Connection[]> {
        if (!userId) {
            throw new BadRequestException('Missing user id');
        }

        return this.connectModel
            .find({ userB: userId, status: ConnectionStatus.PENDING })
            .populate('userA', 'username email avatar phone age');
    }

    async allFriends(userId: string): Promise<any[]> {
        if (!userId) {
            throw new BadRequestException('Missing user id');
        }

        const friends = await this.connectModel
            .find({ status: ConnectionStatus.ACCEPTED, $or: [{ userA: userId }, { userB: userId }] })
            .populate('userA userB', '_id username email phone');

        return friends.map((conn) => {
            const userA: any = conn.userA;
            const userB: any = conn.userB;
            return userA._id.toString() === userId ? userB : userA;
        });
    }

    private async persistAndEmitConnectionRequest(senderId: string, receiverId: string) {
        const sender = await this.userModel.findById(senderId).select('username').lean();
        const name = (sender as any)?.username ?? 'Someone';

        const created = await this.notificationService.create({
            receiverId: receiverId as any,
            senderId: senderId as any,
            type: 'REQUEST',
            message: `${name} sent you a connection request`,
            read: false,
        });

        const payload = await this.notificationService.serializeForSocket(created._id.toString());
        if (payload) {
            this.socketGateway.emitNotificationToUser(receiverId, payload as unknown as Record<string, unknown>);
        }
    }

    private async persistAndEmitMutualMatch(senderId: string, receiverId: string) {
        const [a, b] = await Promise.all([
            this.userModel.findById(senderId).select('username').lean(),
            this.userModel.findById(receiverId).select('username').lean(),
        ]);
        const nameA = (a as any)?.username ?? 'Someone';
        const nameB = (b as any)?.username ?? 'Someone';

        const n1 = await this.notificationService.create({
            receiverId: receiverId as any,
            senderId: senderId as any,
            type: 'MATCH',
            message: `You and ${nameA} both liked each other — it's a match!`,
            read: false,
        });
        const n2 = await this.notificationService.create({
            receiverId: senderId as any,
            senderId: receiverId as any,
            type: 'MATCH',
            message: `You and ${nameB} both liked each other — it's a match!`,
            read: false,
        });

        const [p1, p2] = await Promise.all([
            this.notificationService.serializeForSocket(n1._id.toString()),
            this.notificationService.serializeForSocket(n2._id.toString()),
        ]);
        if (p1) this.socketGateway.emitNotificationToUser(receiverId, p1 as unknown as Record<string, unknown>);
        if (p2) this.socketGateway.emitNotificationToUser(senderId, p2 as unknown as Record<string, unknown>);
    }

    private async persistAndEmitResponse(
        originalSenderId: string,
        responderId: string,
        type: 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED',
        verb: string,
    ) {
        const responder = await this.userModel.findById(responderId).select('username').lean();
        const name = (responder as any)?.username ?? 'Someone';

        const created = await this.notificationService.create({
            receiverId: originalSenderId as any,
            senderId: responderId as any,
            type,
            message: `${name} ${verb}`,
            read: false,
        });

        const payload = await this.notificationService.serializeForSocket(created._id.toString());
        if (payload) {
            this.socketGateway.emitNotificationToUser(originalSenderId, payload as unknown as Record<string, unknown>);
        }
    }
}
