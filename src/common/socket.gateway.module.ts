import { Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { MessagesModule } from '../message/message.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [forwardRef(() => MessagesModule), NotificationModule],
    providers: [SocketGateway],
    exports: [SocketGateway],
})
export class SocketModule {}
