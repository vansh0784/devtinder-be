import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.entity';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    receiverId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    senderId: Types.ObjectId;

    @Prop({
        required: true,
        enum: ['REQUEST', 'MESSAGE', 'MATCH', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED'],
    })
    type: 'REQUEST' | 'MESSAGE' | 'MATCH' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED';

    @Prop()
    roomId?: string;

    @Prop({ required: true })
    message: string;

    @Prop({ default: false })
    read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
