import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../common/jwt.guard';
import type { BaseResponse, SessionDto } from '../common/dto';
import { CollaborationInviteService } from './collaboration-invite.service';
import { CollaborationRoomService } from './collaboration-room.service';
import { CreateCollabRoomDto, InviteCollaborationDto } from './collaboration.dto';

@ApiTags('Collaboration')
@Controller('collaboration')
export class CollaborationController {
    constructor(
        private readonly rooms: CollaborationRoomService,
        private readonly config: ConfigService,
        private readonly invites: CollaborationInviteService,
    ) {}

    @Post('invite')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Notify a matched connection to join your Live Collaboration session',
    })
    @ApiBody({ type: InviteCollaborationDto })
    @ApiOkResponse({ description: 'Push notification persisted and emitted via socket when online' })
    async inviteCollaborator(@Body() dto: InviteCollaborationDto, @Req() req: { session: SessionDto }): Promise<BaseResponse> {
        return this.invites.sendInvite(req.session.user_id, dto.roomId, dto.receiverId);
    }

    @Post('rooms')
    @ApiOperation({ summary: 'Create a shared code session (CRDT doc name + OT seed)' })
    @ApiBody({ type: CreateCollabRoomDto, required: false })
    @ApiOkResponse({ description: 'Room id and public Yjs WebSocket URL for the client' })
    createRoom(@Body() dto: CreateCollabRoomDto) {
        const room = this.rooms.createRoom(dto?.initialDocument ?? '');
        const yjsPublicUrl =
            this.config.get<string>('COLLAB_YJS_PUBLIC_WS') ||
            `ws://localhost:${this.config.get<string>('YJS_WS_PORT') || '1234'}`;
        return {
            roomId: room.roomId,
            yjsWsUrl: yjsPublicUrl,
            yjsDocName: `devtinder-${room.roomId}`,
            codeEditorSocketPath: '/code-editor',
        };
    }

    @Get('rooms/:roomId')
    @ApiOperation({ summary: 'Check that a session still exists (in-memory) and return client sync targets' })
    roomMeta(@Param('roomId') roomId: string) {
        const room = this.rooms.tryGetRoom(roomId);
        if (!room) return { exists: false as const };
        const yjsPublicUrl =
            this.config.get<string>('COLLAB_YJS_PUBLIC_WS') ||
            `ws://localhost:${this.config.get<string>('YJS_WS_PORT') || '1234'}`;
        return {
            exists: true as const,
            roomId: room.roomId,
            yjsWsUrl: yjsPublicUrl,
            yjsDocName: `devtinder-${room.roomId}`,
            codeEditorSocketPath: '/code-editor',
            createdAt: room.createdAt.toISOString(),
            memberCount: room.members.size,
            otRevision: room.otServer.operations.length,
        };
    }
}
