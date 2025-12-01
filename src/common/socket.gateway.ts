import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { MessagesService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
@WebSocketGateway({
  cors: { origin: ['http://localhost:5173',
            'https://devtinder-fe-sigma.vercel.app',] }, // adjust origin for production
  namespace: '/', // default
  transports: ['websocket', 'polling'], // support both

})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('ChatGateway');

  constructor(private readonly messagesService: MessagesService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Optionally store mapping socketId -> userId if client provides userId on connect
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Optionally inform others about offline status
  }

  // Client should call: socket.emit('join_room', { roomId, userId })
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() body: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = body;
    client.join(roomId);
    // Attach userId to socket for reference (optional)
    (client as any).userId = userId;

    // Notify only others in room
    client.to(roomId).emit('user_joined', { userId });
    client.emit('room_joined', { roomId });
    this.logger.log(`${userId} joined room ${roomId}`);
  }

  // Client sends message payload
  // socket.emit('send_message', { roomId, senderId, receiverId, content })
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() payload: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, senderId, receiverId, content } = payload;

    // 1) Persist message
    const saved = await this.messagesService.create(payload);

    // 2) Emit to receiver(s) in that room (except sender)
    client.to(roomId).emit('receive_message', {
      _id: saved._id,
      roomId,
      senderId,
      receiverId,
      content,
      createdAt: saved.createdAt,
      read: saved.read,
    });

    // 3) Ack to sender (so frontend knows it succeeded)
    client.emit('message_sent', {
      _id: saved._id,
      roomId,
      senderId,
      receiverId,
      content,
      createdAt: saved.createdAt,
      read: saved.read,
    });
  }

  // Optional: typing indicator
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: string; senderId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.roomId).emit('user_typing', data);
  }
}
