import {
    Controller,
    UseGuards,
    Get,
    Post,
    Put,
    Req,
    Param,
    Delete,
    Query,
    Body,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { DeveloperService } from './developer.service';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'src/common/entities/user.entity';
import { JwtAuthGuard } from 'src/common/jwt.guard';
import { BaseResponse, SessionDto } from 'src/common/dto';
import { UpdateDevRequestDto } from './developer.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('devs')
@ApiTags('Developer')
export class DeveloperController {
    constructor(private readonly developerService: DeveloperService) {}

    @UseGuards(JwtAuthGuard)
    @Get()
    async getAllDevs(
        @Req() req: { session: SessionDto },
        @Query('page') page: string,
        @Query('limit') limit: string,
    ): Promise<User[]> {
        const currentUserId = req.session.user_id;
        return await this.developerService.getAllDevs(
            currentUserId,
            +page,
            +limit,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('/:id')
    async getDevById(@Param('id') devId: string): Promise<User | null> {
        return await this.developerService.getDevById(devId);
    }

    @UseGuards(JwtAuthGuard)
    @Put('update')
    async updateDevProfile(
        @Req() req: { session: SessionDto },
        @Body() updateDevDto: UpdateDevRequestDto,
    ): Promise<{ message: string; data: User | null }> {
        const currentUserId = req.session.user_id;
        const data = await this.developerService.updateDevProfile(
            currentUserId,
            updateDevDto,
        );
        return {
            message: 'Developer profile updated successfully',
            data: data,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('upload-avatar')
    @UseInterceptors(FileInterceptor('avatar'))
    async uploadDevAvatar(
        @UploadedFile() file: string,
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return await this.developerService.uploadDevAvatar(currentUserId, file);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('')
    async deleteDevAccount(
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return await this.developerService.deleteDevAccount(currentUserId);
    }
    @UseGuards(JwtAuthGuard)
    @Post('search')
    async searchUsers(
        @Query('name') name: string,
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return this.developerService.searchUsers(currentUserId, name);
    }
}
