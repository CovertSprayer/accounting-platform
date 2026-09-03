import { JournalEntryLine } from './journal-entry-line';
import { Account } from '../account/account';
import { AccountType } from '../account/account-type';
import { Money } from '../shared/money';

describe('JournalEntryLine', () => {
  const bankAccount = Account.create(
    'account-1',
    'company-1',
    'Bank',
    AccountType.ASSET,
  );

  it('should create a debit line', () => {
    const line = JournalEntryLine.debit(
      bankAccount,
      Money.create('50000'),
    );

    expect(line.getAccount()).toBe(bankAccount);
    expect(line.getDebit().toString()).toBe('50000.00');
    expect(line.getCredit().isZero()).toBe(true);
  });

  it('should create a credit line', () => {
    const line = JournalEntryLine.credit(
      bankAccount,
      Money.create('50000'),
    );

    expect(line.getDebit().isZero()).toBe(true);
    expect(line.getCredit().toString()).toBe('50000.00');
  });

  it('should reject negative debit amount', () => {
    expect(() =>
      JournalEntryLine.debit(
        bankAccount,
        Money.create('-100'),
      ),
    ).toThrow(
      'Journal entry line amount cannot be negative',
    );
  });

  it('should reject negative credit amount', () => {
    expect(() =>
      JournalEntryLine.credit(
        bankAccount,
        Money.create('-100'),
      ),
    ).toThrow(
      'Journal entry line amount cannot be negative',
    );
  });

  it('should reject zero debit', () => {
    expect(() =>
      JournalEntryLine.debit(
        bankAccount,
        Money.zero(),
      ),
    ).toThrow();
  });

  it('should reject zero credit', () => {
    expect(() =>
      JournalEntryLine.credit(
        bankAccount,
        Money.zero(),
      ),
    ).toThrow();
  });
});
