import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { JournalEntryStatus } from '../../domain/journal/journal-entry-status';
import { InMemoryJournalEntryRepository } from '../../infrastructure/persistence/in-memory-journal-entry-repository';
import { InMemoryAccountRepository } from '../../infrastructure/persistence/in-memory-account-repository';
import { CreateJournalEntry } from './create-journal-entry';

describe('CreateJournalEntry', () => {
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

  it('should create and save a journal entry', async () => {
    const repository = new InMemoryJournalEntryRepository();
    const accountRepository = new InMemoryAccountRepository();

    await accountRepository.save('company-1', bank);
    await accountRepository.save('company-1', revenue);

    const useCase = new CreateJournalEntry(repository, accountRepository);

    const entry = await useCase.execute('company-1', {
      id: 'entry-1',
      date: new Date('2024-01-15'),
      lines: [
        {
          accountId: bank.getId(),
          type: 'DEBIT',
          amount: '10000',
        },
        {
          accountId: revenue.getId(),
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
    const accountRepository = new InMemoryAccountRepository();

    await accountRepository.save('company-1', bank);
    await accountRepository.save('company-1', revenue);

    const useCase = new CreateJournalEntry(repository, accountRepository);

    await expect(
      useCase.execute('company-1', {
        id: 'entry-1',
        date: new Date('2024-01-15'),
        lines: [
          {
            accountId: bank.getId(),
            type: 'DEBIT',
            amount: '10000',
          },
          {
            accountId: revenue.getId(),
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
