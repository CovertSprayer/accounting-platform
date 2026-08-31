import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { AccountType } from 'src/domain/account/account-type';

export class CreateAccountDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    companyId: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(AccountType)
    type: AccountType;
}
