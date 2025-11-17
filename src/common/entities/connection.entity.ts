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
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userA: string | User;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userB: string | User;

    @Prop({
        enum: ConnectionStatus,
        required: true,
        default: ConnectionStatus.PENDING,
    })
    status: string;
}

export const ConnectionSchema = SchemaFactory.createForClass(Connection);
