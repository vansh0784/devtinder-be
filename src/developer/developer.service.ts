import { BadRequestException, Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Connection } from '../common/entities/connection.entity';
import { User } from '../common/entities/user.entity';
import { UpdateDevRequestDto } from './developer.dto';
import { BaseResponse } from '../common/dto';

@Injectable()
export class DeveloperService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Connection.name)
        private connectionModel: Model<Connection>,
        // private readonly configService: ConfigService,
    ) {}

    async getAllDevs(currentUserId: string, page: number = 1, limit: number = 10): Promise<User[]> {
        const me = String(currentUserId ?? '').trim();
        if (!me || !Types.ObjectId.isValid(me)) {
            throw new BadRequestException('Missing or invalid user id');
        }

        const meOid = new Types.ObjectId(me);

        const allConnection = await this.connectionModel.find({
            $or: [{ userA: meOid }, { userB: meOid }],
        });

        const excludeIds: Types.ObjectId[] = [meOid];
        for (const conn of allConnection) {
            const a = conn.userA as Types.ObjectId;
            const b = conn.userB as Types.ObjectId;
            const other = a.equals(meOid) ? b : a;
            if (!excludeIds.some((id) => id.equals(other))) {
                excludeIds.push(other);
            }
        }

        const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
        const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 100) : 20;
        const skip = (safePage - 1) * safeLimit;

        const feedUsers = await this.userModel
            .find({
                _id: { $nin: excludeIds },
            })
            .select('-password')
            .skip(skip)
            .limit(safeLimit)
            .lean()
            .exec();

        return feedUsers as unknown as User[];
    }

    async getDevById(requestedId: string): Promise<User | null> {
        if (!requestedId) throw new BadRequestException('Requested id is missing');
        const dev = await this.userModel.findById(requestedId);
        return dev;
    }

    async updateDevProfile(userId: string, updateRequestDto: UpdateDevRequestDto): Promise<User | null> {
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

    async searchUsers(currentUserId: string, name: string): Promise<BaseResponse> {
        if (!currentUserId || !name) throw new BadRequestException('Missing required fields');
        const users = await this.userModel.find(
            {
                _id: { $ne: currentUserId },
                $or: [{ firstName: { $regex: name, $options: 'i' } }, { lastName: { $regex: name, $options: 'i' } }],
            },
            { password: 0 },
        );

        return {
            statusCode: 200,
            message: users.length > 0 ? 'Users fetched successfully' : 'No users found with that name',
            data: users,
        };
    }
}
