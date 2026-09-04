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
import { GetAccountBalance } from './get-account-balance';
import { GetTrialBalance } from './get-trial-balance';
import { TrialBalanceResponseDto } from './dto/trial-balance-response.dto';
import { TrialBalanceQueryDto } from './dto/trial-balance-query.dto';
import { GeneralLedgerResponseDto } from '../ledger/dto/general-ledger-response.dto';
import { GetGeneralLedger } from '../ledger/get-general-ledger';

@Controller('accounts')
export class AccountController {
    constructor(
        private readonly createAccount: CreateAccount,
        private readonly getAccount: GetAccount,
        private readonly listAccounts: ListAccounts,
        private readonly getAccountBalance: GetAccountBalance,
        private readonly getTrialBalanceUseCase: GetTrialBalance,
        private readonly getGeneralLedgerUseCase: GetGeneralLedger,
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

    @Get('trial-balance')
    async getTrialBalance(
        @Query() query: TrialBalanceQueryDto,
    ): Promise<TrialBalanceResponseDto> {
        const asOfDate = new Date(query.asOfDate);

        const trialBalance = await this.getTrialBalanceUseCase.execute(
            query.companyId,
            asOfDate,
        );

        return TrialBalanceResponseDto.fromDomain(
            query.companyId,
            trialBalance,
            asOfDate,
        );
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

    @Get(':id/balance')
    async getBalance(
        @Param('id') id: string,
        @Query('companyId') companyId: string,
    ): Promise<{ balance: string }> {
        const account = await this.getAccount.execute(
            companyId,
            id,
        );

        if (!account) {
            throw new NotFoundException(
                `Account not found: ${id}`,
            );
        }
        const balance = await this.getAccountBalance.execute(
            companyId,
            id,
        );

        return { balance: balance.toString() };
    }

    @Get(':id/ledger')
    async getGeneralLedger(
        @Param('id') accountId: string,
        @Query('companyId') companyId: string,
    ): Promise<GeneralLedgerResponseDto> {
        const ledger = await this.getGeneralLedgerUseCase.execute(
            companyId,
            accountId,
        );

        return GeneralLedgerResponseDto.fromDomain(ledger);
    }
}
