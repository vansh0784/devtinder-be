import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from 'src/common/entities/posts.entity';
import { PostController } from './posts.controller';
import { PostService } from './posts.service';
import { AWSModule } from 'src/common/aws/aws.module';
import {
    Connection,
    ConnectionSchema,
} from 'src/common/entities/connection.entity';

@Module({
    imports: [
        AWSModule,
        MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
        MongooseModule.forFeature([
            { name: Connection.name, schema: ConnectionSchema },
        ]),
    ],
    providers: [PostService],
    controllers: [PostController],
})
export class PostModule {}
