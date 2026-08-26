import { Account } from "../../domain/account/account";
import { AccountType } from "../../domain/account/account-type";
import { JournalEntry } from "../../domain/journal/journal-entry";
import { JournalEntryLine } from "../../domain/journal/journal-entry-line";
import { Money } from "../../domain/shared/money";
import { InMemoryJournalEntryRepository } from "../../infrastructure/persistence/in-memory-journal-entry-repository";
import { PostJournalEntry } from "./post-journal-entry";
import { JournalEntryStatus } from "../../domain/journal/journal-entry-status";

describe('PostJournalEntry', () => {
    it('it should post a journal entry', async () => {
        const bank = Account.create(
            'bank',
            'Bank',
            AccountType.ASSET,
        );

        const revenue = Account.create(
            'revenue',
            'Revenue',
            AccountType.REVENUE,
        );

        const entry = JournalEntry.create(
            'entry-1',
            [
                JournalEntryLine.debit(bank, Money.create('10000')),
                JournalEntryLine.credit(revenue, Money.create('10000')),
            ]
        )

        const repository = new InMemoryJournalEntryRepository();

        repository.save(entry);

        const useCase = new PostJournalEntry(repository);

        await useCase.execute('entry-1');

        expect(entry.getStatus()).toBe(JournalEntryStatus.POSTED);
    })
})
