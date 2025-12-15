import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  roomId: string; // e.g. sorted concat of two user ids 'userA_userB'

  @Prop({ required: true })
  senderId: string;

  @Prop({ required: true })
  receiverId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  read: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

export interface MessageDocument extends Message, Document {
  createdAt: Date;   // <-- NOW TS KNOWS THEY EXIST
  updatedAt: Date;
}
