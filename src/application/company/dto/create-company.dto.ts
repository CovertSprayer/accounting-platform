import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCompanyDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    name: string;
}