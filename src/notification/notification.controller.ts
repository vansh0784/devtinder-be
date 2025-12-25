import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../common/jwt.guard'; // adjust path if needed
import { SessionDto } from 'src/common/dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
    constructor(private readonly service: NotificationService) {}

    @Get('unread')
    getUnread(@Req() req) {
        // 🔑 User info comes from req.session (set by JwtAuthGuard)
        const userId = req.user_id;
        return this.service.getUnread(userId);
    }

    @Patch('read/:id')
    markRead(@Param('id') id: string) {
        return this.service.markAsRead(id);
    }

    @Patch('read-all')
    markAll(@Req() req) {
        const userId = req.user_id;
        return this.service.markAllAsRead(userId);
    }
}
