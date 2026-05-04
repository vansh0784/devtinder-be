import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';

/** Multipart-safe: author fields come from JWT in the controller; tags may be comma-separated. */
export class CreatePostDto {
    @IsString()
    @IsOptional()
    text?: string;

    @IsOptional()
    @IsArray()
    images?: string[];

    @IsString()
    @IsOptional()
    code?: string;

    @IsString()
    @IsOptional()
    projectLink?: string;

    /** Comma-separated from FormData, e.g. "react,nodejs" */
    @IsString()
    @IsOptional()
    tags?: string;

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
