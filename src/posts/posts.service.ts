import {
    BadRequestException,
    NotFoundException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Post } from 'src/common/entities/posts.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePostDto, UpdatePostDto } from './posts.dto';
import { S3Service } from 'src/common/aws/s3Service';
import { BaseResponse } from 'src/common/dto';
import { Connection } from 'src/common/entities/connection.entity';

@Injectable()
export class PostService {
    constructor(
        @InjectModel(Post.name) private readonly postModel: Model<Post>,
        @InjectModel(Connection.name)
        private readonly connectModel: Model<Connection>,
        private readonly s3Service: S3Service,
    ) {}

    async createPost(
        currentUserId: string,
        dto: CreatePostDto,
        file: Express.Multer.File,
    ): Promise<BaseResponse> {
        if (!currentUserId || !file || !dto)
            throw new BadRequestException('Missing required fields');

        const fileUrl: string = await this.s3Service.uploadFile(file);
        if (!fileUrl)
            throw new BadRequestException('File uploading to S3 gets failed');

        await this.postModel.create({
            author: currentUserId,
            images: fileUrl,
            ...dto,
        });

        return { statusCode: 200, message: 'Post created successfully!' };
    }

    async getFeed(
        currentUserId: string,
        page: number = 1,
        size: number = 10,
    ): Promise<Post[]> {
        if (!currentUserId) throw new BadRequestException('Missing user id');

        const skip = (page - 1) * size;

        const userConnection = await this.connectModel.find({
            $or: [{ userA: currentUserId }, { userB: currentUserId }],
        });

        const connectionList: string[] = userConnection.map((con) =>
            con.userA?.toString() === currentUserId
                ? con.userB.toString()
                : con.userA.toString(),
        );

        let posts = await this.postModel
            .find({
                author: { $in: [currentUserId, ...connectionList] },
            })
            .skip(skip)
            .limit(size)
            .sort({ createdAt: -1 })
            .select('author images text code likes comment tags')
            .exec();

        if (posts.length < size) {
            const remaining = size - posts.length;
            const randomPosts = await this.postModel.aggregate([
                {
                    $match: {
                        author: { $nin: [currentUserId, ...connectionList] },
                    },
                },
                { $sample: { size: remaining } },
                {
                    $project: {
                        author: 1,
                        images: 1,
                        text: 1,
                        code: 1,
                        likes: 1,
                        comments: 1,
                        tags: 1,
                    },
                },
            ]);

            posts = [...posts, ...randomPosts];
        }
        return posts;
    }

    async getMyPosts(
        currentUserId: string,
        page: number = 1,
        size: number = 10,
    ): Promise<Post[]> {
        if (!currentUserId) throw new BadRequestException('Missing user id');
        const skip = (page - 1) * size;
        return await this.postModel
            .find({ author: currentUserId })
            .skip(skip)
            .limit(size)
            .sort({ createdAt: -1 })
            .select('author images text code likes comment tags')
            .exec();
    }

    async getPostsByUser(
        userId: string,
        page: number = 1,
        size: number = 10,
    ): Promise<Post[]> {
        if (!userId) throw new BadRequestException('Profile id is not found');
        const skip = (page - 1) * size;
        return this.postModel
            .find({ author: userId })
            .skip(skip)
            .limit(size)
            .sort({ createdAt: -1 })
            .select('author images text code likes comment tags')
            .exec();
    }

    async getPostById(postId: string): Promise<Post | null> {
        if (!postId) throw new BadRequestException('Post id is missing');

        return await this.postModel.findById(postId);
    }

    async updatePost(
        postId: string,
        currentUserId: string,
        dto: UpdatePostDto,
    ): Promise<BaseResponse> {
        if (!postId || !currentUserId || !dto)
            throw new BadRequestException('Missing required fields');
        const post = await this.postModel.findById(postId);
        if (!post)
            throw new NotFoundException('Post is not found, invalid post id');
        if (post.author.toString() !== currentUserId)
            throw new UnauthorizedException(
                'Not authorized to update the post',
            );

        await this.postModel.findByIdAndUpdate(postId, dto);

        return { statusCode: 200, message: 'Post updated succesfully' };
    }

    async deletePost(
        postId: string,
        currentUserId: string,
    ): Promise<BaseResponse> {
        if (!postId || !currentUserId)
            throw new BadRequestException('Missing required fields');
        const post = await this.postModel.findById(postId);
        if (!post)
            throw new NotFoundException('Post is not found, invalid post id');
        if (post.author.toString() !== currentUserId)
            throw new UnauthorizedException(
                'Not authorized to update the post',
            );
        const imageUrl = post.images;
        await this.s3Service.deleteFile(imageUrl);
        await this.postModel.findByIdAndDelete(postId);

        return { statusCode: 200, message: 'Post deleted succesfully' };
    }

    async toggleLike(
        postId: string,
        currentUserId: string,
    ): Promise<BaseResponse> {
        if (!postId || !currentUserId)
            throw new BadRequestException('Missing required fields');

        const post = await this.postModel.findById(postId);
        if (!post)
            throw new NotFoundException('Post is not found, invalid post id');
        const hasLiked = post.likes.some(
            (id) => id.toString() === currentUserId,
        );
        if (hasLiked) {
            await this.postModel.findByIdAndUpdate(postId, {
                $pull: {
                    likes: currentUserId,
                },
            });
        } else {
            await this.postModel.findByIdAndUpdate(postId, {
                $push: {
                    likes: currentUserId,
                },
            });
        }
        return {
            statusCode: 200,
            message: `Post ${hasLiked ? 'unlikes' : 'likes'} successfully`,
        };
    }

    async addComment(
        postId: string,
        currentUserId: string,
        comment: string,
    ): Promise<BaseResponse> {
        if (!postId || !currentUserId || !comment)
            throw new BadRequestException('Missing required fields');

        const post = await this.postModel.findById(postId);
        if (!post)
            throw new NotFoundException('Post is not found, invalid post id');

        await this.postModel.findByIdAndUpdate(postId, {
            $push: {
                comments: {
                    user: currentUserId,
                    text: comment,
                    createdAt: new Date(),
                },
            },
        });
        return {
            statusCode: 200,
            message: `Comment added successfully`,
        };
    }

    async deleteComment(
        postId: string,
        commentId: string,
        currentUserId: string,
    ): Promise<BaseResponse> {
        if (!postId || !currentUserId || !commentId)
            throw new BadRequestException('Missing required fields');

        const post = await this.postModel.findById(postId);
        if (!post)
            throw new NotFoundException('Post is not found, invalid post id');
        if (post.author.toString() !== currentUserId)
            throw new UnauthorizedException(
                'Not authorized to delete the post',
            );
        await this.postModel.findByIdAndUpdate(postId, {
            $pull: {
                comments: {
                    user: commentId,
                },
            },
        });
        return {
            statusCode: 200,
            message: `Comment deleted successfully`,
        };
    }
}
