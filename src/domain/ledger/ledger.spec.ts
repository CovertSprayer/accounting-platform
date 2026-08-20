import { Account } from "../account/account"
import { AccountType } from "../account/account-type";
import { JournalEntry } from "../journal/journal-entry";
import { JournalEntryLine } from "../journal/journal-entry-line";
import { Money } from "../shared/money";
import { Ledger } from "./ledger";


describe('Ledger', () => {
    const cashAccount = Account.create('id-1', 'Cash', AccountType.ASSET);
    const revenueAccount = Account.create('id-2', 'Revenue', AccountType.REVENUE);

    it('should calculate an asset balance', () => {
        const entry = JournalEntry.create(
            'entry-1',
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
});