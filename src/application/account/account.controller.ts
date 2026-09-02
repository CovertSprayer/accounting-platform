import {
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    Post,
    Query,
} from '@nestjs/common';

import { CreateAccount } from './create-account';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountResponseDto } from './dto/account-response.dto';
import { GetAccount } from './get-account';
import { ListAccounts } from './list-accounts';

@Controller('accounts')
export class AccountController {
    constructor(
        private readonly createAccount: CreateAccount,
        private readonly getAccount: GetAccount,
        private readonly listAccounts: ListAccounts,
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

    @Get()
    async list(
        @Query('companyId') companyId: string,
    ): Promise<AccountResponseDto[]> {
        const accounts = await this.listAccounts.execute(companyId);

        return accounts.map(AccountResponseDto.fromDomain);
    }

    @Get(':id')
    async get(
        @Param('id') id: string,
        @Query('companyId') companyId: string,
    ): Promise<AccountResponseDto> {
        const account = await this.getAccount.execute(
            companyId,
            id,
        );

        if (!account) {
            throw new NotFoundException(
                `Account not found: ${id}`,
            );
        }

        return AccountResponseDto.fromDomain(account);
    }
}
