import { BadRequestException, Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { raceWith } from 'rxjs';
import { Connection } from 'src/common/entities/connection.entity';
import { User } from 'src/common/entities/user.entity';
import { UpdateDevRequestDto } from './developer.dto';
import { BaseResponse } from 'src/common/dto';

@Injectable()
export class DeveloperService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Connection.name)
        private connectionModel: Model<Connection>,
        // private readonly configService: ConfigService,
    ) {}

    async getAllDevs(
        currentUserId: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<User[]> {
        if (!currentUserId) throw new BadRequestException('Missing user id');

        const allConnection = await this.connectionModel.find({
            $or: [{ userA: currentUserId }, { userB: currentUserId }],
        });

        const allConnectionId: string[] = allConnection.map((conn) =>
            conn.userA.toString() === currentUserId
                ? conn.userB.toString()
                : conn.userA.toString(),
        );

        allConnectionId.push(currentUserId);
        const skip = (page - 1) * limit;
        const feedUsers = await this.userModel
            .find({
                _id: { $nin: allConnectionId },
            })
            .skip(skip)
            .limit(limit)
            .exec();

        return feedUsers;
    }

    async getDevById(requestedId: string): Promise<User | null> {
        if (!requestedId)
            throw new BadRequestException('Requested id is missing');
        const dev = await this.userModel.findById(requestedId);
        return dev;
    }

    async updateDevProfile(
        userId: string,
        updateRequestDto: UpdateDevRequestDto,
    ): Promise<User | null> {
        if (!userId) throw new BadRequestException('User id is missing');
        return await this.userModel.findByIdAndUpdate(userId, updateRequestDto);
    }

    async deleteDevAccount(currentUserId: string): Promise<BaseResponse> {
        if (!currentUserId) throw new BadRequestException('User id is missing');
        await this.connectionModel.deleteMany({
            $or: [{ userA: currentUserId }, { userB: currentUserId }],
        });
        await this.userModel.findByIdAndDelete(currentUserId);
        return { statusCode: 200, message: 'Account deleted successfully' };
    }

    uploadDevAvatar(userId: string, file: string): BaseResponse {
        console.log('User id', userId, file);
        return { statusCode: 200, message: 'Avatar Uploaded Successfully' };
    }

    async searchUsers(
        currentUserId: string,
        name: string,
    ): Promise<BaseResponse> {
        if (!currentUserId || !name)
            throw new BadRequestException('Missing required fields');
        const users = await this.userModel.find(
            {
                _id: { $ne: currentUserId },
                $or: [
                    { firstName: { $regex: name, $options: 'i' } },
                    { lastName: { $regex: name, $options: 'i' } },
                ],
            },
            { password: 0 },
        );

        return {
            statusCode: 200,
            message:
                users.length > 0
                    ? 'Users fetched successfully'
                    : 'No users found with that name',
            data: users,
        };
    }
}
