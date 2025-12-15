import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../common/entities/message.entity';
import { MessagesService } from '../message/message.service';
import { MessagesController } from '../message/message.controller';
import { ChatGateway } from '../common/socket.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
  ],
  providers: [MessagesService, ChatGateway],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
