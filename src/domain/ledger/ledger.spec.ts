import { Account } from "../account/account"
import { AccountType } from "../account/account-type";
import { JournalEntry } from "../journal/journal-entry";
import { JournalEntryLine } from "../journal/journal-entry-line";
import { Money } from "../shared/money";
import { Ledger } from "./ledger";


describe('Ledger', () => {
    const companyId = "company-1";
    const cashAccount = Account.create('id-1', companyId, 'Cash', AccountType.ASSET);
    const revenueAccount = Account.create('id-2', companyId, 'Revenue', AccountType.REVENUE);
    const date = new Date('2024-01-15');

    it('should calculate an asset balance', () => {
        const entry = JournalEntry.create(
            'entry-1',
            companyId,
            date,
            [
                JournalEntryLine.debit(cashAccount, Money.create('10000')),
                JournalEntryLine.credit(revenueAccount, Money.create('10000')),
            ]
        );

        entry.post();

        const ledger = new Ledger([entry]);

        const cashBalance = ledger.getBalance(cashAccount).toString();
        expect(cashBalance).toBe('10000.00');
    });

    it('should calculate a revenue balance', () => {
        const entry = JournalEntry.create(
            'entry-2',
            companyId,
            date,
            [
                JournalEntryLine.debit(cashAccount, Money.create('5000')),
                JournalEntryLine.credit(revenueAccount, Money.create('5000')),
            ]
        );

        entry.post();

        const ledger = new Ledger([entry]);

        const revenueBalance = ledger.getBalance(revenueAccount);
        expect(revenueBalance.toString()).toBe('5000.00');
    });

    it('should ignore draft journal entries', () => {
        const entry = JournalEntry.create(
            'entry-1',
            companyId,
            date,
            [
                JournalEntryLine.debit(
                    cashAccount,
                    Money.create('10000'),
                ),
                JournalEntryLine.credit(
                    revenueAccount,
                    Money.create('10000'),
                ),
            ],
        );

        // Notice: DON'T call entry.post()

        const ledger = new Ledger([entry]);

        const cashBalance = ledger.getBalance(cashAccount).toString();
        expect(cashBalance).toBe('0.00');
    });

    it('should calculate balance across multiple posted entries', () => {
        const entry1 = JournalEntry.create(
            'entry-1',
            companyId,
            date,
            [
                JournalEntryLine.debit(
                    cashAccount,
                    Money.create('10000'),
                ),
                JournalEntryLine.credit(
                    revenueAccount,
                    Money.create('10000'),
                ),
            ],
        );

        const entry2 = JournalEntry.create(
            'entry-2',
            companyId,
            date,
            [
                JournalEntryLine.debit(
                    cashAccount,
                    Money.create('5000'),
                ),
                JournalEntryLine.credit(
                    revenueAccount,
                    Money.create('5000'),
                ),
            ],
        );

        entry1.post();
        entry2.post();

        const ledger = new Ledger([entry1, entry2]);

        expect(
            ledger.getBalance(cashAccount).toString(),
        ).toBe('15000.00');
    });

    it('should calculate net balance when an account has both debits and credits', () => {
        const entry = JournalEntry.create(
            'entry-3',
            companyId,
            date,
            [
                JournalEntryLine.debit(
                    cashAccount,
                    Money.create('10000'),
                ),
                JournalEntryLine.credit(
                    revenueAccount,
                    Money.create('10000'),
                ),
            ],
        );

        const adjustmentEntry = JournalEntry.create(
            'entry-4',
            companyId,
            date,
            [
                JournalEntryLine.debit(
                    revenueAccount,
                    Money.create('3000'),
                ),
                JournalEntryLine.credit(
                    cashAccount,
                    Money.create('3000'),
                ),
            ],
        );

        entry.post();
        adjustmentEntry.post();

        const ledger = new Ledger([
            entry,
            adjustmentEntry,
        ]);

        expect(
            ledger.getBalance(cashAccount).toString(),
        ).toBe('7000.00');
    });

    it('should calculate an expense balance', () => {
        const expenseAccount = Account.create(
            'id-3',
            companyId,
            'Rent Expense',
            AccountType.EXPENSE,
        );

        const entry = JournalEntry.create(
            'entry-expense',
            companyId,
            date,
            [
                JournalEntryLine.debit(
                    expenseAccount,
                    Money.create('4000'),
                ),
                JournalEntryLine.credit(
                    cashAccount,
                    Money.create('4000'),
                ),
            ],
        );

        entry.post();

        const ledger = new Ledger([entry]);

        expect(
            ledger.getBalance(expenseAccount).toString(),
        ).toBe('4000.00');
    });

    it('should calculate a liability balance', () => {
        const liabilityAccount = Account.create(
            'id-4',
            companyId,
            'Accounts Payable',
            AccountType.LIABILITY,
        );

        const entry = JournalEntry.create(
            'entry-liability',
            companyId,
            date,
            [
                JournalEntryLine.debit(
                    cashAccount,
                    Money.create('6000'),
                ),
                JournalEntryLine.credit(
                    liabilityAccount,
                    Money.create('6000'),
                ),
            ],
        );

        entry.post();

        const ledger = new Ledger([entry]);

        expect(
            ledger.getBalance(liabilityAccount).toString(),
        ).toBe('6000.00');
    });

    it('should calculate an equity balance', () => {
        const equityAccount = Account.create(
            'id-5',
            companyId,
            'Owner Equity',
            AccountType.EQUITY,
        );

        const entry = JournalEntry.create(
            'entry-equity',
            companyId,
            date,
            [
                JournalEntryLine.debit(
                    cashAccount,
                    Money.create('8000'),
                ),
                JournalEntryLine.credit(
                    equityAccount,
                    Money.create('8000'),
                ),
            ],
        );

        entry.post();

        const ledger = new Ledger([entry]);

        expect(
            ledger.getBalance(equityAccount).toString(),
        ).toBe('8000.00');
    });
});
