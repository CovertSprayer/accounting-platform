import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { JournalEntryStatus } from '../../domain/journal/journal-entry-status';
import { InMemoryJournalEntryRepository } from '../../infrastructure/persistence/in-memory-journal-entry-repository';
import { CreateJournalEntry } from './create-journal-entry';

describe('CreateJournalEntry', () => {
  const bank = Account.create(
    'bank',
    'Bank',
    AccountType.ASSET,
  );

  const revenue = Account.create(
    'revenue',
    'Sales Revenue',
    AccountType.REVENUE,
  );

  it('should create and save a journal entry', async () => {
    const repository = new InMemoryJournalEntryRepository();

    const useCase = new CreateJournalEntry(repository);

    const entry = await useCase.execute('company-1', {
      id: 'entry-1',
      lines: [
        {
          account: bank,
          type: 'DEBIT',
          amount: '10000',
        },
        {
          account: revenue,
          type: 'CREDIT',
          amount: '10000',
        },
      ],
    });

    expect(entry.getId()).toBe('entry-1');

    expect(entry.getStatus()).toBe(
      JournalEntryStatus.DRAFT,
    );

    expect(entry.getLines()).toHaveLength(2);

    const savedEntry = await repository.findById('company-1', 'entry-1');

    expect(savedEntry).toBe(entry);
  });

  it('should reject an unbalanced journal entry', async () => {
    const repository = new InMemoryJournalEntryRepository();

    const useCase = new CreateJournalEntry(repository);

    await expect(
      useCase.execute('company-1', {
        id: 'entry-1',
        lines: [
          {
            account: bank,
            type: 'DEBIT',
            amount: '10000',
          },
          {
            account: revenue,
            type: 'CREDIT',
            amount: '9000',
          },
        ],
      }),
    ).rejects.toThrow(
      'Journal entry must be balanced',
    );
  });
});
