import { Account } from "../account/account"
import { AccountType } from "../account/account-type"
import { Money } from "../shared/money";
import { JournalEntry } from "./journal-entry";
import { JournalEntryLine } from "./journal-entry-line";


describe('JournalEntry', () => {
    const bankAccount = Account.create(
        'account-1',
        'company-1',
        'Bank',
        AccountType.ASSET
    );

    const equipmentAccount = Account.create(
        'account-2',
        'company-1',
        'Equipment',
        AccountType.ASSET,
    );

    const date = new Date('2024-01-15');

    it('should create a balanced journal entry', () => {
        const debitLine = JournalEntryLine.debit(
            equipmentAccount,
            Money.create('80000')
        )

        const creditLine = JournalEntryLine.credit(
            bankAccount,
            Money.create('80000')
        )

        const entry = JournalEntry.create(
            'journal-1',
            'company-1',
            date,
            [debitLine, creditLine]
        )

        expect(entry.getId()).toBe('journal-1')
        expect(entry.getLines()).toHaveLength(2);
    })

    it('should reject an unbalanced journal entry', () => {
        const debitLine = JournalEntryLine.debit(
            equipmentAccount,
            Money.create('80000'),
        );

        const creditLine = JournalEntryLine.credit(
            bankAccount,
            Money.create('70000'),
        );

        expect(() =>
            JournalEntry.create(
                'journal-1',
                'company-1',
                date,
                [debitLine, creditLine],
            ),
        ).toThrow('Journal entry must be balanced');
    });

    it('should reject an entry with less than two lines', () => {
        const debitLine = JournalEntryLine.debit(
            equipmentAccount,
            Money.create('80000'),
        );

        expect(() =>
            JournalEntry.create(
                'journal-1',
                'company-1',
                date,
                [debitLine],
            ),
        ).toThrow(
            'Journal entry must contain at least two lines',
        );
    });
})
