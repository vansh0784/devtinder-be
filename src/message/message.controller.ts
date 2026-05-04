import { Controller, Get, Param, Query, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { MessagesService } from './message.service';
import { JwtAuthGuard } from '../common/jwt.guard';
import type { SessionDto } from '../common/dto';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    /** Current user must be one of the two participants encoded in roomId (<id_sorted>_<id_sorted>). */
    @Get('room/:roomId')
    async getByRoom(
        @Param('roomId') roomId: string,
        @Query('limit') limit: string | undefined,
        @Req() req: { session: SessionDto },
    ) {
        const me = req.session?.user_id;
        if (!me) throw new UnauthorizedException();

        const parts = roomId.split('_').filter(Boolean);
        if (parts.length !== 2 || !parts.includes(me)) {
            throw new UnauthorizedException('Not allowed to read this conversation');
        }

        const lim = limit ? Number(limit) : undefined;
        return this.messagesService.findByRoom(roomId, lim);
    }
}
