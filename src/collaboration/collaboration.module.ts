import { Module } from '@nestjs/common';
import { CollaborationController } from './collaboration.controller';
import { CollaborationInviteService } from './collaboration-invite.service';
import { CollaborationRoomService } from './collaboration-room.service';
import { CodeEditorCollabGateway } from './code-editor-collab.gateway';
import { NotificationModule } from '../notification/notification.module';
import { SocketModule } from '../common/socket.gateway.module';
import { ConnectModule } from '../connection/connect.module';

@Module({
    imports: [NotificationModule, SocketModule, ConnectModule],
    controllers: [CollaborationController],
    providers: [CollaborationRoomService, CodeEditorCollabGateway, CollaborationInviteService],
    exports: [CollaborationRoomService],
})
export class CollaborationModule {}
