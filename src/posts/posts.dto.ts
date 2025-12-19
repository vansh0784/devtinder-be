import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';

export class CreatePostDto {

    @IsString()
    author: string;

    @IsString()
    authorName: string;

    @IsString()
    authorUsername: string;

    @IsString()
    @IsOptional()
    authorAvatar?: string;

    @IsBoolean()
    @IsOptional()
    authorVerified?: boolean;

    @IsString()
    @IsOptional()
    text?: string;

    @IsArray()
    @IsOptional()
    images?: string[];

    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    projectLink?: string;

    @IsArray()
    @IsOptional()
    tags?: string[];

    @IsBoolean()
    @IsOptional()
    isPinned?: boolean;

    @IsEnum(['public', 'private'])
    @IsOptional()
    visibility?: string;
}

export class UpdatePostDto {
    @IsString()
    @IsOptional()
    authorName?: string;

    @IsString()
    @IsOptional()
    authorUsername?: string;

    @IsString()
    @IsOptional()
    authorAvatar?: string;

    @IsBoolean()
    @IsOptional()
    authorVerified?: boolean;

    @IsString()
    @IsOptional()
    text?: string;

    @IsArray()
    @IsOptional()
    images?: string[];

    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    projectLink?: string;

    @IsArray()
    @IsOptional()
    tags?: string[];

    @IsBoolean()
    @IsOptional()
    isPinned?: boolean;

    @IsEnum(['public', 'private'])
    @IsOptional()
    visibility?: string;
}
