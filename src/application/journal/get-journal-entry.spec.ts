import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { JournalEntryStatus } from '../../domain/journal/journal-entry-status';
import { JournalEntry } from '../../domain/journal/journal-entry';
import { JournalEntryLine } from '../../domain/journal/journal-entry-line';
import { InMemoryJournalEntryRepository } from '../../infrastructure/persistence/in-memory-journal-entry-repository';
import { Money } from '../../domain/shared/money';
import { GetJournalEntry } from './get-journal-entry';

describe('GetJournalEntry', () => {
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

    it('should return a journal entry by id', async () => {
        const repository = new InMemoryJournalEntryRepository();

        const entry = JournalEntry.create(
            'entry-1',
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

        const useCase = new GetJournalEntry(repository);

        const result = await useCase.execute(
            'company-1',
            'entry-1',
        );

        expect(result).not.toBeNull();
        expect(result!.getId()).toBe('entry-1');
        expect(result!.getStatus()).toBe(
            JournalEntryStatus.DRAFT,
        );

        expect(result!.getLines()).toHaveLength(2);
    });

    it('should return null when journal entry does not exist', async () => {
        const repository = new InMemoryJournalEntryRepository();

        const useCase = new GetJournalEntry(repository);

        const result = await useCase.execute(
            'company-1',
            'does-not-exist',
        );

        expect(result).toBeNull();
    });

    it('should not return a journal entry belonging to another company', async () => {
        const repository = new InMemoryJournalEntryRepository();

        const entry = JournalEntry.create(
            'entry-1',
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

        const useCase = new GetJournalEntry(repository);

        const result = await useCase.execute(
            'company-2',
            'entry-1',
        );

        expect(result).toBeNull();
    });
});