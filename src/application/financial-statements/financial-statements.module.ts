import { Module } from '@nestjs/common';

import { AccountModule } from '../account/account.module';
import { JournalModule } from '../journal/journal.module';

import { ACCOUNT_REPOSITORY } from '../account/account-repository.token';
import { JOURNAL_ENTRY_REPOSITORY } from '../journal/journal-entry-repository.token';

import { AccountRepository } from '../../domain/account/account-repository';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';

import { GetProfitAndLoss } from './get-profit-and-loss';
import { FinancialStatementsController } from './financial-statements.controller';

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
    ],

    exports: [
        GetProfitAndLoss,
    ],
})
export class FinancialStatementsModule {}