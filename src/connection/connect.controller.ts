import { Controller, Get, Post, Req, Body, UseGuards } from '@nestjs/common';
import { ConnectionService } from './connect.service';
import { BaseResponse } from '../common/dto';
import { User } from '../common/entities/user.entity';
import { Connection } from '../common/entities/connection.entity';
import { JwtAuthGuard } from '../common/jwt.guard';
import { ApiTags } from '@nestjs/swagger';
import { SessionDto } from '../common/dto';
import { SocketGateway } from '../common/socket.gateway';

@UseGuards(JwtAuthGuard)
@Controller('connection')
@ApiTags('Connection')
export class ConnectionController {
    constructor(
        private readonly connectService: ConnectionService,
        private readonly SocketGateway: SocketGateway,
    ) {}

    @Post('right')
    async interested(@Body() body: { recieverId: string }, @Req() req: { session: SessionDto }): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        const response = await this.connectService.interested(currentUserId, body.recieverId);
        this.SocketGateway.handleSendNotification(currentUserId, body.recieverId, 'request');
        return response;
    }

    @Post('left')
    async notInterested(@Body() body: { recieverId: string }, @Req() req: { session: SessionDto }): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return this.connectService.notInterested(currentUserId, body.recieverId);
    }

    @Post('accept')
    async acceptRequest(@Body() body: { requestId: string }, @Req() req: { session: SessionDto }): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return this.connectService.acceptRequest(body?.requestId, currentUserId);
    }

    @Post('reject')
    async rejectRequest(@Body() body: { requestId: string }, @Req() req: { session: SessionDto }): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return this.connectService.rejectRequest(body.requestId, currentUserId);
    }

    @Get('requests')
    async getPendingRequest(@Req() req: { session: SessionDto }): Promise<Connection[]> {
        const currentUserId = req.session.user_id;
        return this.connectService.getPendingRequest(currentUserId);
    }

    @Get('matches')
    async allFriends(@Req() req: { session: SessionDto }): Promise<User[]> {
        const currentUserId = req.session.user_id;
        return this.connectService.allFriends(currentUserId);
    }
}
