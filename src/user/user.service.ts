import { BaseResponse } from 'src/common/dto';
import { CreateUserRequestDto, UpdateUserDto } from './user.dto';
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/common/entities/user.entity';
import { Model } from 'mongoose';
import { hash, compare } from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private readonly configService: ConfigService,
    ) {}

    async registerUser(dto: CreateUserRequestDto): Promise<BaseResponse> {
        // console.log(dto)  
        if (!dto.email || !dto.password || !dto.username)
            throw new BadRequestException('Missing required fields');
        const existing_user = await this.userModel.findOne({
            email: dto.email,
        });
        if (existing_user) throw new ConflictException('Email already existed');
        const hash_password = await hash(dto.password, 10);
        await this.userModel.create({ ...dto, password: hash_password });
        return { statusCode: 200, message: 'User Registered Successfully' };
    }

    async login({
        email,
        password,
    }: {
        email: string;
        password: string;
    }): Promise<BaseResponse> {
        if (!email || !password)
            throw new BadRequestException('Missing required fields ');

        const user: User | null = await this.userModel.findOne({ email });
        if (!user) throw new NotFoundException('No user found with this email');
        const verify_password: boolean = await compare(
            password,
            user?.password,
        );
        if (!verify_password)
            throw new UnauthorizedException('Invalid Password');
        const payload = {
            email: user.email,
            user_id: user.id,
        };
        const jwtSecret = this.configService.get<string>('JWT_SECRET_KEY');
        if (!jwtSecret) {
            throw new Error(
                'JWT_SECRET_KEY is not defined in environment variables',
            );
        }
        const token = sign(payload, jwtSecret);
        return {
            statusCode: 200,
            message: 'Logged in successfully',
            access_token: token,
        };
    }

    async getProfile(user_id: string): Promise<User> {
        if (!user_id) throw new UnauthorizedException('Token has expired');
        const profile = await this.userModel.findById(user_id).lean();
        return { ...profile, password: '' } as User;
    }

    async updateProfile(userId: string,data: UpdateUserDto): Promise<BaseResponse> {
         const updatedUser = await this.userModel
        .findByIdAndUpdate(userId, data, { new: true })
        .select('-password');

      if (!updatedUser) {
        return {
          statusCode: 404,
          message: 'User not found',
        };
      }

      return {
        statusCode: 200,
        message: 'Profile updated successfully',
        data: updatedUser,
      };
    }

    logout(): BaseResponse {
        return { statusCode: 200, message: 'Logout Successfully' };
    }
}
