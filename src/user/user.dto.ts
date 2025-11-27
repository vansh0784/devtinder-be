import {
    IsNotEmpty,
    IsNumber,
    IsArray,
    IsOptional,
    IsString,
    IsBoolean,
} from 'class-validator';

export class CreateUserRequestDto {
    @IsString()
    @IsNotEmpty()
    username: string;

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    username?: string;

    @IsNumber()
    @IsOptional()
    age?: number;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsArray()
    @IsOptional()
    skills?: string[];

    @IsString()
    @IsOptional()
    bio?: string;

    @IsString()
    @IsOptional()
    experienceLevel?: string;

    @IsString()
    @IsOptional()
    github?: string;

    @IsString()
    @IsOptional()
    linkedin?: string;

    @IsString()
    @IsOptional()
    portfolio?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsBoolean()
    @IsOptional()
    isOnline?: boolean;
}
