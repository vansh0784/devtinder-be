import { Body, Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { Post, Req } from '@nestjs/common';
import { BaseResponse, SessionDto } from 'src/common/dto';
import { CreateUserRequestDto } from './user.dto';
import { JwtAuthGuard } from 'src/common/jwt.guard';
import { User } from 'src/common/entities/user.entity';

@Controller('user')
@ApiTags('User')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('register')
    async registerUser(@Body() dto: CreateUserRequestDto): Promise<BaseResponse> {
        return await this.userService.registerUser(dto);
    }

    @Post('login')
    async login(
        @Body() body: { email: string; password: string },
    ): Promise<BaseResponse> {
        return await this.userService.login(body);
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Req() req: {session: SessionDto}): Promise<User> {
        const user_id = (req as any).user.user_id;
        return this.userService.getProfile(user_id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(): Promise<BaseResponse> {
        return this.logout();
    }
}
