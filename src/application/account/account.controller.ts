import {
    Body,
    Controller,
    Post,
} from '@nestjs/common';

import { CreateAccount } from './create-account';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountResponseDto } from './dto/account-response.dto';

@Controller('accounts')
export class AccountController {
    constructor(
        private readonly createAccount: CreateAccount,
    ) { }

    @Post()
    async create(
        @Body() dto: CreateAccountDto,
    ): Promise<AccountResponseDto> {
        const account = await this.createAccount.execute(
            dto.companyId,
            dto.id,
            dto.name,
            dto.type,
        );

        return AccountResponseDto.fromDomain(account);
    }
}
