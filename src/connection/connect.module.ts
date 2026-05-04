import { Module } from '@nestjs/common';
import { ConnectionController } from './connect.controller';
import { ConnectionService } from './connect.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection, ConnectionSchema } from '../common/entities/connection.entity';
import { User, UserSchema } from '../common/entities/user.entity';
import { NotificationModule } from '../notification/notification.module';
import { SocketModule } from '../common/socket.gateway.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Connection.name, schema: ConnectionSchema },
            { name: User.name, schema: UserSchema },
        ]),
        NotificationModule,
        SocketModule,
    ],
    controllers: [ConnectionController],
    providers: [ConnectionService],
})
export class ConnectModule {}
