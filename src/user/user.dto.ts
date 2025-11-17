import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUserRequestDto {
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @IsString()
    lastName: string;

    @IsNotEmpty()
    @IsNumber()
    age: number;

    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

    @IsString()
    phone: string;
}
