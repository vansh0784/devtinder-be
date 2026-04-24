import { Module } from '@nestjs/common';
import { CollaborationController } from './collaboration.controller';
import { CollaborationRoomService } from './collaboration-room.service';
import { CodeEditorCollabGateway } from './code-editor-collab.gateway';

@Module({
    controllers: [CollaborationController],
    providers: [CollaborationRoomService, CodeEditorCollabGateway],
    exports: [CollaborationRoomService],
})
export class CollaborationModule {}
