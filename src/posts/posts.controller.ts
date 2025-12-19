import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    Req,
    UseGuards,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/jwt.guard';
import { PostService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './posts.dto';
import { BaseResponse, SessionDto } from 'src/common/dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

@Controller('posts')
@ApiTags('Posts')
@UseGuards(JwtAuthGuard)
export class PostController {
    constructor(private readonly postService: PostService) {}

    @Post()
    @UseInterceptors(FileInterceptor('image'))
    async createPost(
        @Body() dto: CreatePostDto,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        console.log('file', file);
        return await this.postService.createPost(currentUserId, dto, file);
    }

    @Get()
    async getFeed(
        @Req() req: { session: SessionDto },
        @Query('page') page: string,
        @Query('size') size: string,
    ) {
        const currentUserId = req.session.user_id;
        return await this.postService.getFeed(currentUserId, +page, +size);
    }

    @Get('me')
    async getMyPosts(
        @Req() req: { session: SessionDto },
        @Query('page') page: string,
        @Query('size') size: string,
    ) {
        const currentUserId = req.session.user_id;
        return await this.postService.getMyPosts(currentUserId, +page, +size);
    }

    @Get('user/:userId')
    async getUserPosts(
        @Param('userId') userId: string,
        @Query('page') page: string,
        @Query('size') size: string,
    ) {
        return await this.postService.getPostsByUser(userId, +page, +size);
    }

    @Get(':postId')
    async getPostById(@Param('postId') postId: string) {
        return await this.postService.getPostById(postId);
    }

    @Patch(':postId')
    async updatePost(
        @Param('postId') postId: string,
        @Body() dto: UpdatePostDto,
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return await this.postService.updatePost(postId, currentUserId, dto);
    }

    @Delete(':postId')
    async deletePost(
        @Param('postId') postId: string,
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return await this.postService.deletePost(postId, currentUserId);
    }

    @Post(':postId/like')
    async toggleLike(
        @Param('postId') postId: string,
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return await this.postService.toggleLike(postId, currentUserId);
    }

    @Post(':postId/comment')
    async addComment(
        @Param('postId') postId: string,
        @Body('comment') comment: string,
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return await this.postService.addComment(
            postId,
            currentUserId,
            comment,
        );
    }

    @Delete(':postId/comment/:commentId')
    async deleteComment(
        @Param('postId') postId: string,
        @Param('commentId') commentId: string,
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return await this.postService.deleteComment(
            postId,
            commentId,
            currentUserId,
        );
    }

    // @Patch(':postId/pin')
    // async togglePin(
    //     @Param('postId') postId: string,
    //     @Req() req: { session: SessionDto },
    // ) {
    //     const currentUserId = req.session.user_id;
    //     return await this.postService.togglePin(postId, currentUserId);
    // }
}
