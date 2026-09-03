import { Account } from "../../domain/account/account";
import { AccountType } from "../../domain/account/account-type";
import { JournalEntry } from "../../domain/journal/journal-entry";
import { JournalEntryLine } from "../../domain/journal/journal-entry-line";
import { Money } from "../../domain/shared/money";
import { InMemoryJournalEntryRepository } from "../../infrastructure/persistence/in-memory-journal-entry-repository";
import { PostJournalEntry } from "./post-journal-entry";
import { JournalEntryStatus } from "../../domain/journal/journal-entry-status";

describe('PostJournalEntry', () => {
    const bank = Account.create(
        'bank',
        'company-1',
        'Bank',
        AccountType.ASSET,
    );

    const revenue = Account.create(
        'revenue',
        'company-1',
        'Sales Revenue',
        AccountType.REVENUE,
    );

    it('should post a draft journal entry', async () => {
        const repository = new InMemoryJournalEntryRepository();

        const entry = JournalEntry.create(
            'entry-1',
            'company-1',
            new Date('2024-01-15'),
            [
                JournalEntryLine.debit(
                    bank,
                    Money.create('10000'),
                ),
                JournalEntryLine.credit(
                    revenue,
                    Money.create('10000'),
                ),
            ],
        );

        await repository.save('company-1', entry);

        const useCase = new PostJournalEntry(repository);

        await useCase.execute('company-1', 'entry-1');

        const postedEntry = await repository.findById(
            'company-1',
            'entry-1',
        );

        expect(postedEntry).not.toBeNull();
        expect(postedEntry!.getStatus()).toBe(
            JournalEntryStatus.POSTED,
        );
    });
});