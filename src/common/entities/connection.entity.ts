import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.entity';

export enum ConnectionStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Connection extends Document {
    @Prop({
        type: Types.ObjectId,
        ref: User.name,
        required: true,
    })
    userA: Types.ObjectId | User;

    @Prop({
        type: Types.ObjectId,
        ref: User.name,
        required: true,
    })
    userB: Types.ObjectId | User;

    @Prop({
        type: String,
        enum: Object.values(ConnectionStatus),
        default: ConnectionStatus.PENDING,
        required: true,
    })
    status: ConnectionStatus;
}

export const ConnectionSchema =
    SchemaFactory.createForClass(Connection);
