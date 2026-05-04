import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.entity';
import { Connection } from './connection.entity';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    receiverId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    senderId: Types.ObjectId;

    @Prop({
        required: true,
        enum: ['REQUEST', 'MESSAGE', 'MATCH', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED', 'COLLAB_INVITE'],
    })
    type: 'REQUEST' | 'MESSAGE' | 'MATCH' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED' | 'COLLAB_INVITE';

    @Prop()
    roomId?: string;

    /** When type is COLLAB_INVITE — shared code-editor session id (UUID) */
    @Prop()
    collabRoomId?: string;

    /** When type is REQUEST — connection document id used by POST /connection/accept|reject */
    @Prop({ type: Types.ObjectId, ref: Connection.name })
    connectionRequestId?: Types.ObjectId;

    @Prop({ required: true })
    message: string;

    @Prop({ default: false })
    read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
