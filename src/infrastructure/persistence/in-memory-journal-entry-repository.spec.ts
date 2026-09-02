import { JournalEntry } from "../../domain/journal/journal-entry";
import { Money } from "../../domain/shared/money";
import { InMemoryJournalEntryRepository } from "./in-memory-journal-entry-repository";
import { Account } from "../../domain/account/account";
import { JournalEntryLine } from "../../domain/journal/journal-entry-line";
import { AccountType } from "../../domain/account/account-type";


describe('InMemoryJournalEntryRepository', () => {
    const companyId = 'company-1';

    const bankAccount = Account.create(
        'bank',
        companyId,
        'Bank Account',
        AccountType.ASSET
    );

    const revenueAccount = Account.create(
        'revenue',
        companyId,
        'Revenue Account',
        AccountType.REVENUE
    );

    it('should return all journal entries for a company', async () => {
        const repository = new InMemoryJournalEntryRepository();

        const entry1 = JournalEntry.create(
            'entry-1',
            [
                JournalEntryLine.debit(bankAccount, Money.create('100')),
                JournalEntryLine.credit(revenueAccount, Money.create('100')),
            ],
        );

        const entry2 = JournalEntry.create(
            'entry-2',
            [
                JournalEntryLine.debit(bankAccount, Money.create('200')),
                JournalEntryLine.credit(revenueAccount, Money.create('200')),
            ],
        );

        await repository.save('company-1', entry1);
        await repository.save('company-1', entry2);

        const entries = await repository.findAll('company-1');

        expect(entries).toHaveLength(2);
        expect(entries.map((entry) => entry.getId())).toEqual([
            'entry-1',
            'entry-2',
        ]);
    });

    it('should only return entries belonging to the company', async () => {
        const repository = new InMemoryJournalEntryRepository();

        const company1Entry = JournalEntry.create(
            'entry-1',
            [
                JournalEntryLine.debit(bankAccount, Money.create('100')),
                JournalEntryLine.credit(revenueAccount, Money.create('100')),
            ],
        );

        const company2Entry = JournalEntry.create(
            'entry-2',
            [
                JournalEntryLine.debit(bankAccount, Money.create('200')),
                JournalEntryLine.credit(revenueAccount, Money.create('200')),
            ],
        );

        await repository.save('company-1', company1Entry);
        await repository.save('company-2', company2Entry);

        const entries = await repository.findAll('company-1');

        expect(entries).toHaveLength(1);
        expect(entries[0].getId()).toBe('entry-1');
    });
})