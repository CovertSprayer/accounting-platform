import { Account } from '../account/account';
import { AccountType } from '../account/account-type';
import { JournalEntry } from '../journal/journal-entry';
import { JournalEntryLine } from '../journal/journal-entry-line';
import { Money } from '../shared/money';
import { ProfitAndLoss } from './profit-and-loss';

describe('ProfitAndLoss', () => {
    it('should calculate revenue, expenses, and net profit', () => {
        const revenue = Account.create(
            'revenue',
            'company-1',
            'Sales Revenue',
            AccountType.REVENUE,
        );

        const expense = Account.create(
            'expense',
            'company-1',
            'Office Expense',
            AccountType.EXPENSE,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const salesEntry = JournalEntry.create(
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

        salesEntry.post();

        const expenseEntry = JournalEntry.create(
            'entry-2',
            'company-1',
            new Date('2026-01-05'),
            [
                JournalEntryLine.debit(
                    expense,
                    Money.create('300'),
                ),
                JournalEntryLine.credit(
                    cash,
                    Money.create('300'),
                ),
            ],
        );

        expenseEntry.post();

        const profitAndLoss = ProfitAndLoss.calculate(
            [revenue, expense, cash],
            [salesEntry, expenseEntry],
        );

        expect(
            profitAndLoss.getTotalRevenue().toString(),
        ).toBe('1000.00');

        expect(
            profitAndLoss.getTotalExpenses().toString(),
        ).toBe('300.00');

        expect(
            profitAndLoss.getNetProfit().toString(),
        ).toBe('700.00');
    });

    it('should ignore draft journal entries', () => {
        const revenue = Account.create(
            'revenue',
            'company-1',
            'Sales Revenue',
            AccountType.REVENUE,
        );

        const expense = Account.create(
            'expense',
            'company-1',
            'Office Expense',
            AccountType.EXPENSE,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

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

        const postedEntry = JournalEntry.create(
            'entry-posted',
            'company-1',
            new Date('2026-01-02'),
            [
                JournalEntryLine.debit(
                    expense,
                    Money.create('200'),
                ),
                JournalEntryLine.credit(
                    cash,
                    Money.create('200'),
                ),
            ],
        );

        postedEntry.post();

        const profitAndLoss = ProfitAndLoss.calculate(
            [revenue, expense, cash],
            [draftEntry, postedEntry],
        );

        expect(
            profitAndLoss.getTotalRevenue().toString(),
        ).toBe('0.00');

        expect(
            profitAndLoss.getTotalExpenses().toString(),
        ).toBe('200.00');

        expect(
            profitAndLoss.getNetProfit().toString(),
        ).toBe('-200.00');
    });

    it('should aggregate multiple revenue accounts', () => {
        const salesRevenue = Account.create(
            'sales-revenue',
            'company-1',
            'Sales Revenue',
            AccountType.REVENUE,
        );

        const serviceRevenue = Account.create(
            'service-revenue',
            'company-1',
            'Service Revenue',
            AccountType.REVENUE,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const salesEntry = JournalEntry.create(
            'entry-1',
            'company-1',
            new Date('2026-01-01'),
            [
                JournalEntryLine.debit(
                    cash,
                    Money.create('1000'),
                ),
                JournalEntryLine.credit(
                    salesRevenue,
                    Money.create('1000'),
                ),
            ],
        );

        salesEntry.post();

        const serviceEntry = JournalEntry.create(
            'entry-2',
            'company-1',
            new Date('2026-01-02'),
            [
                JournalEntryLine.debit(
                    cash,
                    Money.create('500'),
                ),
                JournalEntryLine.credit(
                    serviceRevenue,
                    Money.create('500'),
                ),
            ],
        );

        serviceEntry.post();

        const profitAndLoss = ProfitAndLoss.calculate(
            [salesRevenue, serviceRevenue, cash],
            [salesEntry, serviceEntry],
        );

        expect(
            profitAndLoss.getTotalRevenue().toString(),
        ).toBe('1500.00');

        expect(
            profitAndLoss.getTotalExpenses().toString(),
        ).toBe('0.00');

        expect(
            profitAndLoss.getNetProfit().toString(),
        ).toBe('1500.00');
    });

    it('should aggregate multiple expense accounts', () => {
        const revenue = Account.create(
            'revenue',
            'company-1',
            'Sales Revenue',
            AccountType.REVENUE,
        );

        const salaryExpense = Account.create(
            'salary',
            'company-1',
            'Salary Expense',
            AccountType.EXPENSE,
        );

        const rentExpense = Account.create(
            'rent',
            'company-1',
            'Rent Expense',
            AccountType.EXPENSE,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const salaryEntry = JournalEntry.create(
            'entry-1',
            'company-1',
            new Date('2026-01-01'),
            [
                JournalEntryLine.debit(
                    salaryExpense,
                    Money.create('400'),
                ),
                JournalEntryLine.credit(
                    cash,
                    Money.create('400'),
                ),
            ],
        );

        salaryEntry.post();

        const rentEntry = JournalEntry.create(
            'entry-2',
            'company-1',
            new Date('2026-01-02'),
            [
                JournalEntryLine.debit(
                    rentExpense,
                    Money.create('300'),
                ),
                JournalEntryLine.credit(
                    cash,
                    Money.create('300'),
                ),
            ],
        );

        rentEntry.post();

        const revenueEntry = JournalEntry.create(
            'entry-3',
            'company-1',
            new Date('2026-01-03'),
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

        revenueEntry.post();

        const profitAndLoss = ProfitAndLoss.calculate(
            [
                revenue,
                salaryExpense,
                rentExpense,
                cash,
            ],
            [
                salaryEntry,
                rentEntry,
                revenueEntry,
            ],
        );

        expect(
            profitAndLoss.getTotalRevenue().toString(),
        ).toBe('1000.00');

        expect(
            profitAndLoss.getTotalExpenses().toString(),
        ).toBe('700.00');

        expect(
            profitAndLoss.getNetProfit().toString(),
        ).toBe('300.00');
    });

    it('should calculate a net loss when expenses exceed revenue', () => {
        const revenue = Account.create(
            'revenue',
            'company-1',
            'Sales Revenue',
            AccountType.REVENUE,
        );

        const expense = Account.create(
            'expense',
            'company-1',
            'Office Expense',
            AccountType.EXPENSE,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const revenueEntry = JournalEntry.create(
            'entry-1',
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

        revenueEntry.post();

        const expenseEntry = JournalEntry.create(
            'entry-2',
            'company-1',
            new Date('2026-01-02'),
            [
                JournalEntryLine.debit(
                    expense,
                    Money.create('800'),
                ),
                JournalEntryLine.credit(
                    cash,
                    Money.create('800'),
                ),
            ],
        );

        expenseEntry.post();

        const profitAndLoss = ProfitAndLoss.calculate(
            [revenue, expense, cash],
            [revenueEntry, expenseEntry],
        );

        expect(
            profitAndLoss.getTotalRevenue().toString(),
        ).toBe('500.00');

        expect(
            profitAndLoss.getTotalExpenses().toString(),
        ).toBe('800.00');

        expect(
            profitAndLoss.getNetProfit().toString(),
        ).toBe('-300.00');
    });

    it('should ignore non-revenue and non-expense accounts', () => {
        const revenue = Account.create(
            'revenue',
            'company-1',
            'Sales Revenue',
            AccountType.REVENUE,
        );

        const expense = Account.create(
            'expense',
            'company-1',
            'Office Expense',
            AccountType.EXPENSE,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const liability = Account.create(
            'loan',
            'company-1',
            'Bank Loan',
            AccountType.LIABILITY,
        );

        const revenueEntry = JournalEntry.create(
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

        revenueEntry.post();

        const expenseEntry = JournalEntry.create(
            'entry-2',
            'company-1',
            new Date('2026-01-02'),
            [
                JournalEntryLine.debit(
                    expense,
                    Money.create('300'),
                ),
                JournalEntryLine.credit(
                    cash,
                    Money.create('300'),
                ),
            ],
        );

        expenseEntry.post();

        const liabilityEntry = JournalEntry.create(
            'entry-3',
            'company-1',
            new Date('2026-01-03'),
            [
                JournalEntryLine.debit(
                    cash,
                    Money.create('5000'),
                ),
                JournalEntryLine.credit(
                    liability,
                    Money.create('5000'),
                ),
            ],
        );

        liabilityEntry.post();

        const profitAndLoss = ProfitAndLoss.calculate(
            [
                revenue,
                expense,
                cash,
                liability,
            ],
            [
                revenueEntry,
                expenseEntry,
                liabilityEntry,
            ],
        );

        expect(
            profitAndLoss.getTotalRevenue().toString(),
        ).toBe('1000.00');

        expect(
            profitAndLoss.getTotalExpenses().toString(),
        ).toBe('300.00');

        expect(
            profitAndLoss.getNetProfit().toString(),
        ).toBe('700.00');
    });

    it('should reduce revenue when revenue is debited', () => {
        const revenue = Account.create(
            'revenue',
            'company-1',
            'Sales Revenue',
            AccountType.REVENUE,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const saleEntry = JournalEntry.create(
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

        saleEntry.post();

        const reversalEntry = JournalEntry.create(
            'entry-2',
            'company-1',
            new Date('2026-01-02'),
            [
                JournalEntryLine.debit(
                    revenue,
                    Money.create('200'),
                ),
                JournalEntryLine.credit(
                    cash,
                    Money.create('200'),
                ),
            ],
        );

        reversalEntry.post();

        const profitAndLoss = ProfitAndLoss.calculate(
            [revenue, cash],
            [saleEntry, reversalEntry],
        );

        expect(
            profitAndLoss.getTotalRevenue().toString(),
        ).toBe('800.00');
    });

    it('should reduce expenses when expense is credited', () => {
        const expense = Account.create(
            'expense',
            'company-1',
            'Office Expense',
            AccountType.EXPENSE,
        );

        const cash = Account.create(
            'cash',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const expenseEntry = JournalEntry.create(
            'entry-1',
            'company-1',
            new Date('2026-01-01'),
            [
                JournalEntryLine.debit(
                    expense,
                    Money.create('500'),
                ),
                JournalEntryLine.credit(
                    cash,
                    Money.create('500'),
                ),
            ],
        );

        expenseEntry.post();

        const reversalEntry = JournalEntry.create(
            'entry-2',
            'company-1',
            new Date('2026-01-02'),
            [
                JournalEntryLine.credit(
                    expense,
                    Money.create('100'),
                ),
                JournalEntryLine.debit(
                    cash,
                    Money.create('100'),
                ),
            ],
        );

        reversalEntry.post();

        const profitAndLoss = ProfitAndLoss.calculate(
            [expense, cash],
            [expenseEntry, reversalEntry],
        );

        expect(
            profitAndLoss.getTotalExpenses().toString(),
        ).toBe('400.00');
    });

    it('should return zero when there is no revenue or expense activity', () => {
        const revenue = Account.create(
            'revenue',
            'company-1',
            'Sales Revenue',
            AccountType.REVENUE,
        );

        const expense = Account.create(
            'expense',
            'company-1',
            'Office Expense',
            AccountType.EXPENSE,
        );

        const profitAndLoss = ProfitAndLoss.calculate(
            [revenue, expense],
            [],
        );

        expect(
            profitAndLoss.getTotalRevenue().toString(),
        ).toBe('0.00');

        expect(
            profitAndLoss.getTotalExpenses().toString(),
        ).toBe('0.00');

        expect(
            profitAndLoss.getNetProfit().toString(),
        ).toBe('0.00');
    });
});