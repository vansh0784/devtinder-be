import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseResponse } from '../common/dto';
import { Connection, ConnectionStatus } from '../common/entities/connection.entity';

@Injectable()
export class ConnectionService {
    constructor(
        @InjectModel(Connection.name)
        private connectModel: Model<Connection>,
    ) {}

    async interested(senderId: string, receiverId: string): Promise<BaseResponse> {
        if (senderId === receiverId) {
            throw new BadRequestException(`You can't send invitation to yourself`);
        }

        // 🔍 Check if receiver already swiped right
        const reverseConnection = await this.connectModel.findOne({
            userA: receiverId,
            userB: senderId,
            status: ConnectionStatus.PENDING,
        });

        // 🎉 Mutual right swipe → MATCH
        if (reverseConnection) {
            reverseConnection.status = ConnectionStatus.ACCEPTED;
            await reverseConnection.save();

            return { statusCode: 200, message: "It's a Match 🎉" };
        }

        // ❌ Prevent duplicate swipe / connection
        const existing_connection = await this.connectModel.findOne({
            $or: [
                { userA: senderId, userB: receiverId },
                { userA: receiverId, userB: senderId },
            ],
        });

        if (existing_connection) {
            throw new BadRequestException('Already swiped or connected');
        }

        // ➕ Create new pending request
        await this.connectModel.create({
            userA: senderId,
            userB: receiverId,
            status: ConnectionStatus.PENDING,
        });

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

        return { statusCode: 200, message: 'Request rejected successfully!!' };
    }

    async getPendingRequest(userId: string): Promise<Connection[]> {
        if (!userId) {
            throw new BadRequestException('Missing user id');
        }

        return this.connectModel.find({ userB: userId, status: ConnectionStatus.PENDING }).populate('userA', 'firstName lastName email phone age');
    }

    async allFriends(userId: string): Promise<any[]> {
        if (!userId) {
            throw new BadRequestException('Missing user id');
        }

        const friends = await this.connectModel.find({ status: ConnectionStatus.ACCEPTED, $or: [{ userA: userId }, { userB: userId }] }).populate('userA userB', '_id username email phone');

        return friends.map((conn) => {
            const userA: any = conn.userA;
            const userB: any = conn.userB;
            return userA._id.toString() === userId ? userB : userA;
        });
    }
}
