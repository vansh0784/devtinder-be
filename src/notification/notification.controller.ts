import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../common/jwt.guard';
import { SessionDto } from '../common/dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
    constructor(private readonly service: NotificationService) {}

    @Get('unread')
    getUnread(@Req() req: { session: SessionDto }) {
        return this.service.getUnread(req.session.user_id);
    }

    @Patch('read/:id')
    markRead(@Param('id') id: string) {
        return this.service.markAsRead(id);
    }

    @Patch('read-all')
    markAll(@Req() req: { session: SessionDto }) {
        return this.service.markAllAsRead(req.session.user_id);
    }
}
