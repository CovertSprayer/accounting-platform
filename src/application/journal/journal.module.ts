import { Module } from '@nestjs/common';
import { CreateJournalEntry } from './create-journal-entry';
import { PostJournalEntry } from './post-journal-entry';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';
import { PrismaJournalEntryRepository } from '../../infrastructure/persistence/prisma/prisma-journal-entry-repository';
import { AccountRepository } from 'src/domain/account/account-repository';
import { JournalController } from './journal.controller';
import { AccountModule, ACCOUNT_REPOSITORY } from '../account/account.module';

export const JOURNAL_ENTRY_REPOSITORY = Symbol(
    'JOURNAL_ENTRY_REPOSITORY',
);

@Module({
    imports: [AccountModule],
    controllers: [JournalController],
    providers: [
        {
            provide: JOURNAL_ENTRY_REPOSITORY,
            useClass: PrismaJournalEntryRepository,
        },
        {
            provide: CreateJournalEntry,
            useFactory: (
                repository: JournalEntryRepository,
                accountRepository: AccountRepository,
            ) => {
                return new CreateJournalEntry(repository, accountRepository);
            },
            inject: [
                JOURNAL_ENTRY_REPOSITORY,
                ACCOUNT_REPOSITORY,
            ],
        },
        {
            provide: PostJournalEntry,
            useFactory: (
                repository: JournalEntryRepository,
            ) => {
                return new PostJournalEntry(repository);
            },
            inject: [JOURNAL_ENTRY_REPOSITORY],
        },
    ],

    exports: [
        CreateJournalEntry,
        PostJournalEntry,
    ],
})
export class JournalModule { }