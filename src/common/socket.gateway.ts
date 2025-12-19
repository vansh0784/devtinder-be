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
import { MessagesService } from '../message/message.service';
import { CreateMessageDto } from '../message/create-message.dto';
import { NotificationService } from 'src/notification/notification.service';
import type { Adapter } from 'socket.io-adapter';


const onlineUsers = new Map<string, string>(); // userId -> socketId

@Injectable()
@WebSocketGateway({
  cors: { origin: "*" }, // adjust origin for production
  namespace: '/', // default
  transports: ['websocket'], // support both

})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('ChatGateway');

  constructor(private readonly messagesService: MessagesService, private readonly notificationService: NotificationService,
  ) { }

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;

    if (userId) {
      onlineUsers.set(userId, client.id);
      (client as any).userId = userId;
      this.logger.log(`User ${userId} connected with socket ${client.id}`);
    } else {
      this.logger.warn(`Socket connected without userId: ${client.id}`);
    }
    this.logger.log(`🟢 Online users: ${Array.from(onlineUsers.keys())}`);

  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;

    if (userId) {
      onlineUsers.delete(userId);
      this.logger.log(`User ${userId} disconnected`);
    } else {
      this.logger.log(`Socket disconnected: ${client.id}`);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() body: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = body;

    // 🧹 LEAVE previous room (VERY IMPORTANT)
    const previousRoom = (client as any).currentRoom;
    if (previousRoom) {
      client.leave(previousRoom);
      this.logger.log(`${userId} left room ${previousRoom}`);
    }

    // ✅ JOIN new room
    client.join(roomId);
    (client as any).userId = userId;
    (client as any).currentRoom = roomId;

    client.emit('room_joined', { roomId });

    this.logger.log(`${userId} joined room ${roomId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() payload: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, senderId, receiverId, content } = payload;

    // 🛑 SECURITY + LOGIC CHECK
    if ((client as any).currentRoom !== roomId) {
      this.logger.warn(
        `Blocked message: user ${senderId} not in room ${roomId}`,
      );
      return;
    }

    // 1️⃣ Save message
    const saved = await this.messagesService.create(payload);

    // 2️⃣ Emit to everyone ELSE in room
    client.to(roomId).emit('receive_message', saved);

    // 2️⃣.1 🔔 MESSAGE NOTIFICATION (if receiver not in room)
    const receiverSocketId = onlineUsers.get(receiverId);
    // const receiverInRoom =
    //   receiverSocketId &&
    //   this.server.sockets.adapter.rooms.get(roomId)?.has(receiverSocketId);

    let receiverInRoom = false;

    if (receiverSocketId) {
      const adapter = this.server.adapter as unknown as Adapter;
      const room = adapter.rooms.get(roomId);
      receiverInRoom = room ? room.has(receiverSocketId) : false;
    }


    // if (receiverSocketId && !receiverInRoom) {
    //   this.server.to(receiverSocketId).emit('notification', {
    //     type: 'MESSAGE',
    //     senderId,
    //     message: 'sent you a message',
    //     roomId,
    //     createdAt: new Date(),
    //   });
    // }

    // 3️⃣ Ack sender
    // 🔔 Save notification in DB
    await this.notificationService.create({
      receiverId,
      senderId,
      type: 'MESSAGE',
      roomId,
      message: 'sent you a message',
    });
    this.logger.log(`📦 Notification saved for ${receiverId}`);

    // 🔔 Emit real-time notification (if online & not in room)
    if (receiverSocketId && !receiverInRoom) {
      this.server.to(receiverSocketId).emit('notification', {
        type: 'MESSAGE',
        senderId,
        message: 'sent you a message',
        roomId,
        createdAt: new Date(),
      });
    }

    this.logger.log(`🔔 Emitting notification to ${receiverSocketId}`);


    client.emit('message_sent', saved);

    this.logger.log(`📡 receiverSocketId = ${receiverSocketId}`);


  }

  @SubscribeMessage('load_messages')
  async handleLoadMessages(
    @MessageBody() body: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = body;

    const messages = await this.messagesService.findByRoom(roomId);

    client.emit('chat_history', messages);
  }

  // Optional: typing indicator
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: string; senderId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(data.roomId).emit('user_typing', data);
  }

  @SubscribeMessage('send_request')
  async handleSendRequest(
    @MessageBody() data: { senderId: string; receiverId: string },
  ) {
    const receiverSocketId = onlineUsers.get(data.receiverId);

    // if (receiverSocketId) {
    //   this.server.to(receiverSocketId).emit('notification', {
    //     type: 'REQUEST',
    //     senderId: data.senderId,
    //     message: 'sent you a connection request',
    //     createdAt: new Date(),
    //   });
    // }
    // 🔔 Save request notification in DB
    await this.notificationService.create({
      receiverId: data.receiverId,
      senderId: data.senderId,
      type: 'REQUEST',
      message: 'sent you a connection request',
    });

    // 🔔 Emit real-time notification if online
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('notification', {
        type: 'REQUEST',
        senderId: data.senderId,
        message: 'sent you a connection request',
        createdAt: new Date(),
      });
    }

  }

  sendRequestNotification(senderId: string, receiverId: string) {
    const receiverSocketId = onlineUsers.get(receiverId);

    // Save notification
    this.notificationService.create({
      senderId,
      receiverId,
      type: 'REQUEST',
      message: 'sent you a connection request',
    });

    // Emit realtime notification
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('notification', {
        type: 'REQUEST',
        senderId,
        message: 'sent you a connection request',
        createdAt: new Date(),
      });
    }
  }


}
