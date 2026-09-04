import { forwardRef, Module } from '@nestjs/common';

import { CreateAccount } from './create-account';
import { AccountRepository } from '../../domain/account/account-repository';

import { PrismaAccountRepository } from '../../infrastructure/persistence/prisma/prisma-account-repository';
import { AccountController } from './account.controller';
import { GetAccount } from './get-account';
import { ListAccounts } from './list-accounts';
import { GetAccountBalance } from './get-account-balance';
import { JournalModule } from '../journal/journal.module';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';
import { ACCOUNT_REPOSITORY } from './account-repository.token';
import { JOURNAL_ENTRY_REPOSITORY } from '../journal/journal-entry-repository.token';
import { GetTrialBalance } from './get-trial-balance';
import { GetGeneralLedger } from '../ledger/get-general-ledger';

@Module({
    imports: [
        forwardRef(() => JournalModule),
    ],
    controllers: [AccountController],
    providers: [
        {
            provide: ACCOUNT_REPOSITORY,
            useClass: PrismaAccountRepository,
        },

        {
            provide: CreateAccount,
            useFactory: (
                repository: AccountRepository,
            ) => {
                return new CreateAccount(repository);
            },
            inject: [ACCOUNT_REPOSITORY],
        },

        {
            provide: GetAccount,
            useFactory: (repository: AccountRepository) => {
                return new GetAccount(repository);
            },
            inject: [ACCOUNT_REPOSITORY],
        },

        {
            provide: ListAccounts,
            useFactory: (repository: AccountRepository) => {
                return new ListAccounts(repository);
            },
            inject: [ACCOUNT_REPOSITORY],
        },

        {
            provide: GetAccountBalance,
            useFactory: (
                accountRepository: AccountRepository,
                journalEntryRepository: JournalEntryRepository
            ) => {
                return new GetAccountBalance(accountRepository, journalEntryRepository);
            },
            inject: [ACCOUNT_REPOSITORY, JOURNAL_ENTRY_REPOSITORY],
        },

        {
            provide: GetTrialBalance,
            useFactory: (
                accountRepository: AccountRepository,
                journalEntryRepository: JournalEntryRepository
            ) => {
                return new GetTrialBalance(accountRepository, journalEntryRepository);
            },
            inject: [ACCOUNT_REPOSITORY, JOURNAL_ENTRY_REPOSITORY],
        },

        {
            provide: GetGeneralLedger,
            useFactory: (
                accountRepository: AccountRepository,
                journalEntryRepository: JournalEntryRepository
            ) => {
                return new GetGeneralLedger(accountRepository, journalEntryRepository);
            },
            inject: [ACCOUNT_REPOSITORY, JOURNAL_ENTRY_REPOSITORY],
        }
    ],
    exports: [
        CreateAccount, 
        ACCOUNT_REPOSITORY, 
        GetAccountBalance,
        GetTrialBalance,
        GetGeneralLedger,
    ],
})
export class AccountModule { }
