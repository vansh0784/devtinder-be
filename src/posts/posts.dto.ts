import {
    IsString,
    IsOptional,
    IsArray,
    IsUrl,
    IsEnum,
} from 'class-validator';

export class CreatePostDto {
    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsString()
    images?: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsUrl()
    link?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    visibility?: 'public' | 'connections' | 'private';
}

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @IsString()
    images?: string;

    @IsOptional()
    @IsString()
    code?: string;

    @IsOptional()
    @IsString()
    link?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsEnum(['public', 'private', 'connections'])
    visibility?: string;

    @IsOptional()
    isPinned?: boolean;
}
