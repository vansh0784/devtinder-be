import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true })
    firstName: string;

    @Prop()
    lastName: string;

    @Prop({ required: true })
    age: number;

    @Prop({ unique: true, required: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ type: [String], default: [] })
    skills: string[];

    @Prop({ default: '' })
    bio: string;

    @Prop({ default: '' })
    experienceLevel: string;

    @Prop({ default: '' })
    github: string;

    @Prop({ default: '' })
    linkedin: string;

    @Prop({ default: '' })
    portfolio: string;

    @Prop({ default: '' })
    avatar: string;

    @Prop({ default: '' })
    location: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: false })
    isOnline: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
