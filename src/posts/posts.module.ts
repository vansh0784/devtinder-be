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
import { User, UserSchema } from 'src/common/entities/user.entity';

@Module({
    imports: [
        AWSModule,
        MongooseModule.forFeature([
            { name: Post.name, schema: PostSchema },
            { name: Connection.name, schema: ConnectionSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    providers: [PostService],
    controllers: [PostController],
})
export class PostModule {}
