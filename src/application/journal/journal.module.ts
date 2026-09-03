import { forwardRef, Module } from '@nestjs/common';
import { CreateJournalEntry } from './create-journal-entry';
import { PostJournalEntry } from './post-journal-entry';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';
import { PrismaJournalEntryRepository } from '../../infrastructure/persistence/prisma/prisma-journal-entry-repository';
import { AccountRepository } from 'src/domain/account/account-repository';
import { JournalController } from './journal.controller';
import { AccountModule } from '../account/account.module';
import { GetJournalEntry } from './get-journal-entry';
import { ListJournalEntry } from './list-journal-entry';
import { JOURNAL_ENTRY_REPOSITORY } from './journal-entry-repository.token';
import { ACCOUNT_REPOSITORY } from '../account/account-repository.token';

@Module({
    imports: [
        forwardRef(() => AccountModule),
    ],
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

        {
            provide: GetJournalEntry,
            useFactory: (repository: JournalEntryRepository) => {
                return new GetJournalEntry(repository);
            },
            inject: [JOURNAL_ENTRY_REPOSITORY],
        },

        {
            provide: ListJournalEntry,
            useFactory: (repository: JournalEntryRepository) => {
                return new ListJournalEntry(repository);
            },
            inject: [JOURNAL_ENTRY_REPOSITORY],
        }
    ],

    exports: [
        CreateJournalEntry,
        PostJournalEntry,
        JOURNAL_ENTRY_REPOSITORY,
    ],
})
export class JournalModule { }