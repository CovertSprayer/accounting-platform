import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { InMemoryAccountRepository } from '../../infrastructure/persistence/in-memory-account-repository';
import { InMemoryJournalEntryRepository } from '../../infrastructure/persistence/in-memory-journal-entry-repository';
import { JournalEntry } from '../../domain/journal/journal-entry';
import { JournalEntryLine } from '../../domain/journal/journal-entry-line';
import { Money } from '../../domain/shared/money';
import { GetGeneralLedger } from './get-general-ledger';

describe('GetAccountLedger', () => {
    it('should return posted transactions for the requested account', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository = new InMemoryJournalEntryRepository();

        const getGeneralLedger = new GetGeneralLedger(
            accountRepository,
            journalEntryRepository,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const revenue = Account.create(
            'revenue',
            'company-1',
            'Revenue',
            AccountType.REVENUE,
        );

        await accountRepository.save('company-1', cash);
        await accountRepository.save('company-1', revenue);

        const entry = JournalEntry.create(
            'entry-1',
            'company-1',
            new Date('2026-01-01'),
            [
                JournalEntryLine.debit(
                    cash,
                    Money.create('1000'),
                ),
                JournalEntryLine.credit(
                    revenue,
                    Money.create('1000'),
                ),
            ],
        );

        entry.post();

        await journalEntryRepository.save(
            'company-1',
            entry,
        );

        const ledger = await getGeneralLedger.execute(
            'company-1',
            'cash',
        );

        expect(ledger.accountId).toBe('cash');
        expect(ledger.accountName).toBe('Bank');

        expect(ledger.entries).toHaveLength(1);

        expect(ledger.entries[0].journalEntryId).toBe('entry-1');
        expect(ledger.entries[0].debit.toString()).toBe('1000.00');
        expect(ledger.entries[0].credit.toString()).toBe('0.00');
        expect(ledger.entries[0].balance.toString()).toBe('1000.00');
    });

    it('should ignore draft journal entries', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository =
            new InMemoryJournalEntryRepository();

        const getGeneralLedger = new GetGeneralLedger(
            accountRepository,
            journalEntryRepository,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const revenue = Account.create(
            'revenue',
            'company-1',
            'Revenue',
            AccountType.REVENUE,
        );

        await accountRepository.save('company-1', cash);
        await accountRepository.save('company-1', revenue);

        const draftEntry = JournalEntry.create(
            'entry-draft',
            'company-1',
            new Date('2026-01-01'),
            [
                JournalEntryLine.debit(
                    cash,
                    Money.create('500'),
                ),
                JournalEntryLine.credit(
                    revenue,
                    Money.create('500'),
                ),
            ],
        );

        await journalEntryRepository.save(
            'company-1',
            draftEntry,
        );

        const postedEntry = JournalEntry.create(
            'entry-posted',
            'company-1',
            new Date('2026-01-02'),
            [
                JournalEntryLine.debit(
                    cash,
                    Money.create('1000'),
                ),
                JournalEntryLine.credit(
                    revenue,
                    Money.create('1000'),
                ),
            ],
        );

        postedEntry.post();

        await journalEntryRepository.save(
            'company-1',
            postedEntry,
        );

        const ledger = await getGeneralLedger.execute(
            'company-1',
            'cash',
        );

        expect(ledger.entries).toHaveLength(1);

        expect(
            ledger.entries[0].journalEntryId,
        ).toBe('entry-posted');

        expect(
            ledger.entries[0].balance.toString(),
        ).toBe('1000.00');
    });

    it('should calculate the running balance across multiple transactions', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository =
            new InMemoryJournalEntryRepository();

        const getGeneralLedger = new GetGeneralLedger(
            accountRepository,
            journalEntryRepository,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const revenue = Account.create(
            'revenue',
            'company-1',
            'Revenue',
            AccountType.REVENUE,
        );

        await accountRepository.save('company-1', cash);
        await accountRepository.save('company-1', revenue);

        const entry1 = JournalEntry.create(
            'entry-1',
            'company-1',
            new Date('2026-01-01'),
            [
                JournalEntryLine.debit(
                    cash,
                    Money.create('1000'),
                ),
                JournalEntryLine.credit(
                    revenue,
                    Money.create('1000'),
                ),
            ],
        );

        entry1.post();

        await journalEntryRepository.save(
            'company-1',
            entry1,
        );

        const entry2 = JournalEntry.create(
            'entry-2',
            'company-1',
            new Date('2026-01-05'),
            [
                JournalEntryLine.debit(
                    cash,
                    Money.create('500'),
                ),
                JournalEntryLine.credit(
                    revenue,
                    Money.create('500'),
                ),
            ],
        );

        entry2.post();

        await journalEntryRepository.save(
            'company-1',
            entry2,
        );

        const entry3 = JournalEntry.create(
            'entry-3',
            'company-1',
            new Date('2026-01-10'),
            [
                JournalEntryLine.credit(
                    cash,
                    Money.create('300'),
                ),
                JournalEntryLine.debit(
                    revenue,
                    Money.create('300'),
                ),
            ],
        );

        entry3.post();

        await journalEntryRepository.save(
            'company-1',
            entry3,
        );

        const ledger = await getGeneralLedger.execute(
            'company-1',
            'cash',
        );

        expect(ledger.entries).toHaveLength(3);

        expect(ledger.entries[0].balance.toString()).toBe('1000.00');
        expect(ledger.entries[1].balance.toString()).toBe('1500.00');
        expect(ledger.entries[2].balance.toString()).toBe('1200.00');
    });

    it('should order ledger entries by journal entry date', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository =
            new InMemoryJournalEntryRepository();

        const getGeneralLedger = new GetGeneralLedger(
            accountRepository,
            journalEntryRepository,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const revenue = Account.create(
            'revenue',
            'company-1',
            'Revenue',
            AccountType.REVENUE,
        );

        await accountRepository.save('company-1', cash);
        await accountRepository.save('company-1', revenue);

        const laterEntry = JournalEntry.create(
            'entry-3',
            'company-1',
            new Date('2026-01-10'),
            [
                JournalEntryLine.debit(
                    cash,
                    Money.create('300'),
                ),
                JournalEntryLine.credit(
                    revenue,
                    Money.create('300'),
                ),
            ],
        );

        laterEntry.post();

        await journalEntryRepository.save(
            'company-1',
            laterEntry,
        );

        const earlierEntry = JournalEntry.create(
            'entry-1',
            'company-1',
            new Date('2026-01-01'),
            [
                JournalEntryLine.debit(
                    cash,
                    Money.create('1000'),
                ),
                JournalEntryLine.credit(
                    revenue,
                    Money.create('1000'),
                ),
            ],
        );

        earlierEntry.post();

        await journalEntryRepository.save(
            'company-1',
            earlierEntry,
        );

        const middleEntry = JournalEntry.create(
            'entry-2',
            'company-1',
            new Date('2026-01-05'),
            [
                JournalEntryLine.debit(
                    cash,
                    Money.create('500'),
                ),
                JournalEntryLine.credit(
                    revenue,
                    Money.create('500'),
                ),
            ],
        );

        middleEntry.post();

        await journalEntryRepository.save(
            'company-1',
            middleEntry,
        );

        const ledger = await getGeneralLedger.execute(
            'company-1',
            'cash',
        );

        expect(ledger.entries).toHaveLength(3);

        expect(ledger.entries[0].journalEntryId).toBe('entry-1');
        expect(ledger.entries[1].journalEntryId).toBe('entry-2');
        expect(ledger.entries[2].journalEntryId).toBe('entry-3');

        expect(ledger.entries[0].balance.toString()).toBe('1000.00');
        expect(ledger.entries[1].balance.toString()).toBe('1500.00');
        expect(ledger.entries[2].balance.toString()).toBe('1800.00');
    });

    it('should only return ledger entries belonging to the requested company', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository =
            new InMemoryJournalEntryRepository();

        const getGeneralLedger = new GetGeneralLedger(
            accountRepository,
            journalEntryRepository,
        );

        const company1Cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const company1Revenue = Account.create(
            'revenue',
            'company-1',
            'Revenue',
            AccountType.REVENUE,
        );

        const company2Cash = Account.create(
            'cash',
            'company-2',
            'Bank',
            AccountType.ASSET,
        );

        const company2Revenue = Account.create(
            'revenue',
            'company-2',
            'Revenue',
            AccountType.REVENUE,
        );

        await accountRepository.save('company-1', company1Cash);
        await accountRepository.save('company-1', company1Revenue);

        await accountRepository.save('company-2', company2Cash);
        await accountRepository.save('company-2', company2Revenue);

        const company1Entry = JournalEntry.create(
            'entry-company-1',
            'company-1',
            new Date('2026-01-01'),
            [
                JournalEntryLine.debit(
                    company1Cash,
                    Money.create('1000'),
                ),
                JournalEntryLine.credit(
                    company1Revenue,
                    Money.create('1000'),
                ),
            ],
        );

        company1Entry.post();

        await journalEntryRepository.save(
            'company-1',
            company1Entry,
        );

        const company2Entry = JournalEntry.create(
            'entry-company-2',
            'company-2',
            new Date('2026-01-01'),
            [
                JournalEntryLine.debit(
                    company2Cash,
                    Money.create('5000'),
                ),
                JournalEntryLine.credit(
                    company2Revenue,
                    Money.create('5000'),
                ),
            ],
        );

        company2Entry.post();

        await journalEntryRepository.save(
            'company-2',
            company2Entry,
        );

        const ledger = await getGeneralLedger.execute(
            'company-1',
            'cash',
        );

        expect(ledger.accountId).toBe('cash');
        expect(ledger.entries).toHaveLength(1);

        expect(
            ledger.entries[0].journalEntryId,
        ).toBe('entry-company-1');

        expect(
            ledger.entries[0].debit.toString(),
        ).toBe('1000.00');

        expect(
            ledger.entries[0].balance.toString(),
        ).toBe('1000.00');
    });

    it('should only return transactions for the requested account', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository =
            new InMemoryJournalEntryRepository();

        const getGeneralLedger = new GetGeneralLedger(
            accountRepository,
            journalEntryRepository,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const revenue = Account.create(
            'revenue',
            'company-1',
            'Revenue',
            AccountType.REVENUE,
        );

        const expense = Account.create(
            'expense',
            'company-1',
            'Office Expense',
            AccountType.EXPENSE,
        );

        await accountRepository.save('company-1', cash);
        await accountRepository.save('company-1', revenue);
        await accountRepository.save('company-1', expense);

        const entry = JournalEntry.create(
            'entry-1',
            'company-1',
            new Date('2026-01-01'),
            [
                JournalEntryLine.debit(
                    cash,
                    Money.create('1000'),
                ),
                JournalEntryLine.credit(
                    revenue,
                    Money.create('700'),
                ),
                JournalEntryLine.credit(
                    expense,
                    Money.create('300'),
                ),
            ],
        );

        entry.post();

        await journalEntryRepository.save(
            'company-1',
            entry,
        );

        const ledger = await getGeneralLedger.execute(
            'company-1',
            'cash',
        );

        expect(ledger.entries).toHaveLength(1);

        expect(
            ledger.entries[0].journalEntryId,
        ).toBe('entry-1');

        expect(
            ledger.entries[0].debit.toString(),
        ).toBe('1000.00');

        expect(
            ledger.entries[0].credit.toString(),
        ).toBe('0.00');

        expect(
            ledger.entries[0].balance.toString(),
        ).toBe('1000.00');
    });
});