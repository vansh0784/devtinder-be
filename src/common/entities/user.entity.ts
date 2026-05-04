import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true })
    username: string;

    @Prop()
    age: number;

    @Prop({ unique: true, required: true, index: true })
    email: string;

    @Prop({})
    password: string;

    @Prop()
    phone: string;

    @Prop({ type: [String], default: [] })
    skills: string[];

    @Prop({ type: [String], default: [] })
    interests: string[];

    /** From onboarding — e.g. Open Source, Startup */
    @Prop({ type: [String], default: [] })
    projectTypes: string[];

    @Prop()
    bio: string;

    @Prop()
    experienceLevel: string;

    @Prop()
    github: string;

    @Prop()
    linkedin: string;

    @Prop()
    portfolio: string;

    @Prop()
    avatar: string;

    @Prop()
    location: string;

    @Prop()
    isActive: boolean;

    @Prop()
    isOnline: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
