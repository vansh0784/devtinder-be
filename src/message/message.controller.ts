import { Controller, Get, Param, Query } from '@nestjs/common';
import { MessagesService } from './message.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // GET /messages/room/:roomId?limit=50
  @Get('room/:roomId')
  async getByRoom(
    @Param('roomId') roomId: string, 
    @Query('limit') limit?: string
  ) {
    const lim = limit ? Number(limit) : undefined;

    const messages = await this.messagesService.findByRoom(roomId, lim);
    return messages.reverse(); // ascending order
  }
}
