import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Message, MessageSchema } from '../common/entities/message.entity';
import { MessagesService } from '../message/message.service';
import { MessagesController } from '../message/message.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]), NotificationModule],
    providers: [MessagesService],
    controllers: [MessagesController],
    exports: [MessagesService],
})
export class MessagesModule {}
