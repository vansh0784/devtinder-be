// import { Controller, Get, Post, Req, Param, UseGuards } from '@nestjs/common';
// import { ConnectionService } from './connect.service';
// import { BaseResponse } from 'src/common/dto';
// import { User } from 'src/common/entities/user.entity';
// import { Connection } from 'src/common/entities/connection.entity';
// import { JwtAuthGuard } from 'src/common/jwt.guard';
// import { ApiTags } from '@nestjs/swagger';
// import { SessionDto } from 'src/common/dto';

// @Controller('connection')
// @ApiTags('Connection')
// export class ConnectionController {
//     constructor(private readonly connectService: ConnectionService) {}

//     @UseGuards(JwtAuthGuard)
//     @Post('send')
//     async interested(
//         @Param('recieverId') recieverId: string,
//         @Req() req: { session: SessionDto },
//     ): Promise<BaseResponse> {
//         const currentUserId = req.session.user_id;
//         return this.connectService.interested(currentUserId, recieverId);
//     }

//     @UseGuards(JwtAuthGuard)
//     @Post('send')
//     async notInterested(
//         @Param('recieverId') recieverId: string,
//         @Req() req: { session: SessionDto },
//     ): Promise<BaseResponse> {
//         const currentUserId = req.session.user_id;
//         return this.connectService.notInterested(currentUserId, recieverId);
//     }

//     @UseGuards(JwtAuthGuard)
//     @Post('accepted/:requestId')
//     async acceptRequest(
//         @Param('requestId') requestId: string,
//         @Req() req: { session: SessionDto },
//     ): Promise<BaseResponse> {
//         const currentUserId = req.session.user_id;
//         return this.connectService.acceptRequest(requestId, currentUserId);
//     }

//     @UseGuards(JwtAuthGuard)
//     @Post('rejected/:requestId')
//     async rejectRequest(
//         @Param('requestId') requestId: string,
//         @Req() req: { session: SessionDto },
//     ): Promise<BaseResponse> {
//         const currentUserId = req.session.user_id;
//         return this.connectService.rejectRequest(requestId, currentUserId);
//     }

//     @UseGuards(JwtAuthGuard)
//     @Get('requests')
//     async getPendingRequest(
//         @Req() req: { session: SessionDto },
//     ): Promise<Connection[]> {
//         const currentUserId = req.session.user_id;
//         return this.connectService.getPendingRequest(currentUserId);
//     }

//     @UseGuards(JwtAuthGuard)
//     @Get('friends')
//     async allFriends(@Req() req: { session: SessionDto }): Promise<User[]> {
//         const currentUserId = req.session.user_id;
//         return this.connectService.allFriends(currentUserId);
//     }
// }

import {
    Controller,
    Get,
    Post,
    Req,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ConnectionService } from './connect.service';
import { BaseResponse } from 'src/common/dto';
import { User } from 'src/common/entities/user.entity';
import { Connection } from 'src/common/entities/connection.entity';
import { JwtAuthGuard } from 'src/common/jwt.guard';
import { ApiTags } from '@nestjs/swagger';
import { SessionDto } from 'src/common/dto';

@Controller('connection')
@ApiTags('Connection')
export class ConnectionController {
    constructor(
        private readonly connectService: ConnectionService,
    ) {}

    // =========================
    // RIGHT SWIPE
    // =========================
    @UseGuards(JwtAuthGuard)
    @Post('right/:receiverId')
    async interested(
        @Param('receiverId') receiverId: string,
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return this.connectService.interested(
            currentUserId,
            receiverId,
        );
    }

    // =========================
    // LEFT SWIPE
    // =========================
    @UseGuards(JwtAuthGuard)
    @Post('left/:receiverId')
    async notInterested(
        @Param('receiverId') receiverId: string,
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return this.connectService.notInterested(
            currentUserId,
            receiverId,
        );
    }

    // =========================
    // ACCEPT REQUEST (OPTIONAL)
    // =========================
    @UseGuards(JwtAuthGuard)
    @Post('accept/:requestId')
    async acceptRequest(
        @Param('requestId') requestId: string,
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return this.connectService.acceptRequest(
            requestId,
            currentUserId,
        );
    }

    // =========================
    // REJECT REQUEST
    // =========================
    @UseGuards(JwtAuthGuard)
    @Post('reject/:requestId')
    async rejectRequest(
        @Param('requestId') requestId: string,
        @Req() req: { session: SessionDto },
    ): Promise<BaseResponse> {
        const currentUserId = req.session.user_id;
        return this.connectService.rejectRequest(
            requestId,
            currentUserId,
        );
    }

    // =========================
    // WHO LIKED ME
    // =========================
    @UseGuards(JwtAuthGuard)
    @Get('requests')
    async getPendingRequest(
        @Req() req: { session: SessionDto },
    ): Promise<Connection[]> {
        const currentUserId = req.session.user_id;
        return this.connectService.getPendingRequest(
            currentUserId,
        );
    }

    // =========================
    // MY MATCHES
    // =========================
    @UseGuards(JwtAuthGuard)
    @Get('matches')
    async allFriends(
        @Req() req: { session: SessionDto },
    ): Promise<User[]> {
        const currentUserId = req.session.user_id;
        return this.connectService.allFriends(
            currentUserId,
        );
    }
}
