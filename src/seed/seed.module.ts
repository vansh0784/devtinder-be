import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { User, UserSchema } from '../common/entities/user.entity';
import { Post, PostSchema } from '../common/entities/posts.entity';
import { Connection, ConnectionSchema } from '../common/entities/connection.entity';
import { Message, MessageSchema } from '../common/entities/message.entity';
import { Notification, NotificationSchema } from '../common/entities/notification.entity';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Post.name, schema: PostSchema },
            { name: Connection.name, schema: ConnectionSchema },
            { name: Message.name, schema: MessageSchema },
            { name: Notification.name, schema: NotificationSchema },
        ]),
    ],
    controllers: [SeedController],
    providers: [SeedService],
})
export class SeedModule {}
