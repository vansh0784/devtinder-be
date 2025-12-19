import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  receiverId: string;

  @Prop({ required: true })
  senderId: string;

  @Prop({ required: true })
  type: "REQUEST" | "MESSAGE";

  @Prop()
  roomId?: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  read: boolean;
}

export const NotificationSchema =
  SchemaFactory.createForClass(Notification);
