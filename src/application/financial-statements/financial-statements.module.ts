import { Module } from '@nestjs/common';

import { AccountModule } from '../account/account.module';
import { JournalModule } from '../journal/journal.module';

import { ACCOUNT_REPOSITORY } from '../account/account-repository.token';
import { JOURNAL_ENTRY_REPOSITORY } from '../journal/journal-entry-repository.token';

import { AccountRepository } from '../../domain/account/account-repository';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';

import { GetProfitAndLoss } from './get-profit-and-loss';
import { FinancialStatementsController } from './financial-statements.controller';
import { GetBalanceSheet } from './get-balance-sheet';
import { GetTrialBalance } from './get-trial-balance';

@Module({
    imports: [
        AccountModule,
        JournalModule,
    ],

    controllers: [
        FinancialStatementsController,
    ],

    providers: [
        {
            provide: GetTrialBalance,
            useFactory: (
                accountRepository: AccountRepository,
                journalEntryRepository: JournalEntryRepository
            ) => {
                return new GetTrialBalance(accountRepository, journalEntryRepository);
            },
            inject: [
                ACCOUNT_REPOSITORY,
                JOURNAL_ENTRY_REPOSITORY
            ],
        },

        {
            provide: GetProfitAndLoss,
            useFactory: (
                accountRepository: AccountRepository,
                journalEntryRepository: JournalEntryRepository,
            ) => {
                return new GetProfitAndLoss(
                    accountRepository,
                    journalEntryRepository,
                );
            },
            inject: [
                ACCOUNT_REPOSITORY,
                JOURNAL_ENTRY_REPOSITORY,
            ],
        },

        {
            provide: GetBalanceSheet,
            useFactory: (
                accountRepository: AccountRepository,
                journalEntryRepository: JournalEntryRepository,
            ) => {
                return new GetBalanceSheet(
                    accountRepository,
                    journalEntryRepository,
                );
            },
            inject: [
                ACCOUNT_REPOSITORY,
                JOURNAL_ENTRY_REPOSITORY,
            ],
        },
    ],

    exports: [
        GetProfitAndLoss,
        GetBalanceSheet,
    ],
})
export class FinancialStatementsModule { }