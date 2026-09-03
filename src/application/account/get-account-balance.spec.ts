import { InMemoryAccountRepository } from '../../infrastructure/persistence/in-memory-account-repository';
import { InMemoryJournalEntryRepository } from '../../infrastructure/persistence/in-memory-journal-entry-repository';
import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { JournalEntry } from '../../domain/journal/journal-entry';
import { JournalEntryLine } from '../../domain/journal/journal-entry-line';
import { Money } from '../../domain/shared/money';
import { GetAccountBalance } from './get-account-balance';

describe('GetAccountBalance', () => {

    it('should return correct balances for asset and revenue accounts', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository = new InMemoryJournalEntryRepository();

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

        const journalEntry = JournalEntry.create(
            'entry-1',
            'company-1',
            new Date(),
            [
                JournalEntryLine.debit(cash, Money.create('100.00')),
                JournalEntryLine.credit(revenue, Money.create('100.00')),
            ],
        );

        const journalEntry2 = JournalEntry.create(
            'entry-2',
            'company-1',
            new Date(),
            [
                JournalEntryLine.debit(cash, Money.create('50.00')),
                JournalEntryLine.credit(revenue, Money.create('50.00')),
            ],
        );

        journalEntry.post();
        journalEntry2.post();

        await journalEntryRepository.save('company-1', journalEntry);
        await journalEntryRepository.save('company-1', journalEntry2);

        const useCase = new GetAccountBalance(accountRepository, journalEntryRepository);

        const cashBalance = await useCase.execute('company-1', 'cash');
        const revenueBalance = await useCase.execute('company-1', 'revenue');

        expect(cashBalance.toString()).toBe('150.00');
        expect(revenueBalance.toString()).toBe('150.00');
    });

    it('should return zero when account has no posted entries', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository = new InMemoryJournalEntryRepository();

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        await accountRepository.save('company-1', cash);

        const useCase = new GetAccountBalance(accountRepository, journalEntryRepository);

        const cashBalance = await useCase.execute('company-1', 'cash');

        expect(cashBalance.toString()).toBe('0.00');
    });

    it('should ignore draft journal entries', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository = new InMemoryJournalEntryRepository();

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
            'entry-1',
            'company-1',
            new Date(),
            [
                JournalEntryLine.debit(cash, Money.create('100.00')),
                JournalEntryLine.credit(revenue, Money.create('100.00')),
            ],
        );

        const postedEntry = JournalEntry.create(
            'entry-2',
            'company-1',
            new Date(),
            [
                JournalEntryLine.debit(cash, Money.create('50.00')),
                JournalEntryLine.credit(revenue, Money.create('50.00')),
            ],
        );

        // Notice: DON'T call draftEntry.post()

        await journalEntryRepository.save('company-1', draftEntry);

        postedEntry.post();

        await journalEntryRepository.save('company-1', postedEntry);

        const useCase = new GetAccountBalance(accountRepository, journalEntryRepository);

        const cashBalance = await useCase.execute('company-1', 'cash');

        expect(cashBalance.toString()).toBe('50.00');
    });

    it('should throw when account does not exist', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository = new InMemoryJournalEntryRepository();

        const useCase = new GetAccountBalance(accountRepository, journalEntryRepository);

        await expect(
            useCase.execute('company-1', 'does-not-exist'),
        ).rejects.toThrow('Account not found: does-not-exist');
    });

    it('should not include entries from another company', async () => {
        const accountRepository = new InMemoryAccountRepository();
        const journalEntryRepository = new InMemoryJournalEntryRepository();

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
            'entry-1',
            'company-1',
            new Date(),
            [
                JournalEntryLine.debit(company1Cash, Money.create('100.00')),
                JournalEntryLine.credit(company1Revenue, Money.create('100.00')),
            ],
        );

        const company2Entry = JournalEntry.create(
            'entry-1',
            'company-2',
            new Date(),
            [
                JournalEntryLine.debit(company2Cash, Money.create('9999.00')),
                JournalEntryLine.credit(company2Revenue, Money.create('9999.00')),
            ],
        );

        company1Entry.post();
        company2Entry.post();

        await journalEntryRepository.save('company-1', company1Entry);
        await journalEntryRepository.save('company-2', company2Entry);

        const useCase = new GetAccountBalance(accountRepository, journalEntryRepository);

        const company1CashBalance = await useCase.execute('company-1', 'cash');

        expect(company1CashBalance.toString()).toBe('100.00');
    });
});
