import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    author: Types.ObjectId;

    @Prop({ type: String, required: true })
    authorName: string;

    @Prop({ type: String, required: true })
    authorUsername: string;

    @Prop({ type: String, default: '' })
    authorAvatar: string;

    @Prop({ type: Boolean, default: false })
    authorVerified: boolean;

    @Prop({ default: '' })
    text: string;

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop({ default: '' })
    code: string;

    @Prop({ default: '' })
    projectLink: string;

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
    likes: Types.ObjectId[];

    @Prop({
        type: [
            {
                user: { type: Types.ObjectId, ref: 'User', required: true },
                text: { type: String, required: true },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        default: [],
    })
    comments: { user: Types.ObjectId; text: string; createdAt: Date }[];

    @Prop({ type: Number, default: 0 })
    shares: number;

    @Prop({ default: false })
    isPinned: boolean;

    @Prop({
        type: String,
        enum: ['public', 'private'],
        default: 'public',
    })
    visibility: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);
