import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { ConnectModule } from './connection/connect.module';
import { PostModule } from './posts/posts.module';
import { DeveloperModule } from './developer/developer.module';

@Module({
    imports: [
        CommonModule,
        UserModule,
        ConnectModule,
        PostModule,
        DeveloperModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
