import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { ConnectModule } from './connection/connect.module';
import { MessagesModule } from './message/message.module';
import { PostModule } from './posts/posts.module';
import { DeveloperModule } from './developer/developer.module';
import { NotificationModule } from "./notification/notification.module";

import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';

@Module({
    imports: [
        CommonModule,
        UserModule,
        ConnectModule,
        PostModule,
        DeveloperModule,
        MessagesModule,
        NotificationModule,
        MulterModule.register({
            storage: multer.memoryStorage(),
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
