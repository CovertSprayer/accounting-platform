import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { JournalEntry } from '../../domain/journal/journal-entry';
import { JournalEntryLine } from '../../domain/journal/journal-entry-line';
import { Money } from '../../domain/shared/money';
import { GetTrialBalance } from './get-trial-balance';
import { InMemoryAccountRepository } from '../../infrastructure/persistence/in-memory-account-repository';
import { InMemoryJournalEntryRepository } from '../../infrastructure/persistence/in-memory-journal-entry-repository';

describe('GetTrialBalance', () => {
    it('should return trial balance for a company', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository = new InMemoryJournalEntryRepository();

        const getTrialBalance = new GetTrialBalance(
            accountRepository,
            journalEntryRepository,
        );

        const companyId = 'company-1';

        const cash = Account.create(
            'cash',
            companyId,
            'Bank',
            AccountType.ASSET,
        );

        const revenue = Account.create(
            'revenue',
            companyId,
            'Revenue',
            AccountType.REVENUE,
        );

        await accountRepository.save(companyId, cash);
        await accountRepository.save(companyId, revenue);

        const journalEntry = JournalEntry.create(
            'entry-1',
            companyId,
            new Date('2024-01-15'),
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

        journalEntry.post();

        await journalEntryRepository.save(
            companyId,
            journalEntry,
        );

        const trialBalance = await getTrialBalance.execute(
            companyId,
            new Date('2024-01-31'),
        );

        const rows = trialBalance.getRows();

        expect(rows).toHaveLength(2);

        expect(rows[0].accountId).toBe('cash');
        expect(rows[0].debit.toString()).toBe('1000.00');
        expect(rows[0].credit.toString()).toBe('0.00');

        expect(rows[1].accountId).toBe('revenue');
        expect(rows[1].debit.toString()).toBe('0.00');
        expect(rows[1].credit.toString()).toBe('1000.00');

        expect(trialBalance.getTotalDebit().toString()).toBe(
            '1000.00',
        );

        expect(trialBalance.getTotalCredit().toString()).toBe(
            '1000.00',
        );
    });

    it('should only include accounts and journal entries belonging to the company', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository = new InMemoryJournalEntryRepository();

        const getTrialBalance = new GetTrialBalance(
            accountRepository,
            journalEntryRepository,
        );

        const company1 = 'company-1';
        const company2 = 'company-2';

        const company1Cash = Account.create(
            'cash',
            company1,
            'Bank',
            AccountType.ASSET,
        );

        const company1Revenue = Account.create(
            'revenue',
            company1,
            'Revenue',
            AccountType.REVENUE,
        );

        const company2Cash = Account.create(
            'cash',
            company2,
            'Bank',
            AccountType.ASSET,
        );

        const company2Revenue = Account.create(
            'revenue',
            company2,
            'Revenue',
            AccountType.REVENUE,
        );

        await accountRepository.save(company1, company1Cash);
        await accountRepository.save(company1, company1Revenue);
        await accountRepository.save(company2, company2Cash);
        await accountRepository.save(company2, company2Revenue);

        const company1Entry = JournalEntry.create(
            'entry-1',
            company1,
            new Date('2024-01-15'),
            [
                JournalEntryLine.debit(
                    company1Cash,
                    Money.create('100'),
                ),
                JournalEntryLine.credit(
                    company1Revenue,
                    Money.create('100'),
                ),
            ],
        );

        const company2Entry = JournalEntry.create(
            'entry-2',
            company2,
            new Date('2024-01-15'),
            [
                JournalEntryLine.debit(
                    company2Cash,
                    Money.create('9999'),
                ),
                JournalEntryLine.credit(
                    company2Revenue,
                    Money.create('9999'),
                ),
            ],
        );

        company1Entry.post();
        company2Entry.post();

        await journalEntryRepository.save(
            company1,
            company1Entry,
        );

        await journalEntryRepository.save(
            company2,
            company2Entry,
        );

        const trialBalance = await getTrialBalance.execute(
            company1,
            new Date('2024-01-31'),
        );

        expect(trialBalance.getTotalDebit().toString()).toBe(
            '100.00',
        );

        expect(trialBalance.getTotalCredit().toString()).toBe(
            '100.00',
        );
    });
});