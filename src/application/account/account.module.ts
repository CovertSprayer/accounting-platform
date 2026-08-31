import { Module } from '@nestjs/common';

import { CreateAccount } from './create-account';
import { AccountRepository } from '../../domain/account/account-repository';

import { PrismaAccountRepository } from '../../infrastructure/persistence/prisma/prisma-account-repository';
import { AccountController } from './account.controller';

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
    ],
    exports: [CreateAccount],
})
export class AccountModule { }
