import {
    IsString,
    IsNumber,
    IsOptional,
    IsEmail,
    IsArray,
} from 'class-validator';

export class UpdateDevRequestDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsNumber()
    age?: number;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    experienceLevel?: string;

    @IsOptional()
    @IsString()
    github?: string;

    @IsOptional()
    @IsString()
    linkedin?: string;

    @IsOptional()
    @IsString()
    portfolio?: string;

    @IsOptional()
    @IsString()
    location?: string;
}
