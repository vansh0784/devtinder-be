import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    author: Types.ObjectId;

    @Prop({ default: '' })
    text: string;

    @Prop({ type: String, default: '' })
    images: string;

    @Prop({ default: '' })
    code: string;

    @Prop({ default: '' })
    link: string;

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

    @Prop({ default: false })
    isPinned: boolean;

    @Prop({ default: 'public' })
    visibility: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);
