import { Module } from '@nestjs/common';

import { CreateAccount } from './create-account';
import { AccountRepository } from '../../domain/account/account-repository';

import { PrismaAccountRepository } from '../../infrastructure/persistence/prisma/prisma-account-repository';
import { AccountController } from './account.controller';
import { GetAccount } from './get-account';
import { ListAccounts } from './list-accounts';

export const ACCOUNT_REPOSITORY = Symbol(
    'ACCOUNT_REPOSITORY',
);

@Module({
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
    ],
    exports: [CreateAccount, ACCOUNT_REPOSITORY],
})
export class AccountModule { }
