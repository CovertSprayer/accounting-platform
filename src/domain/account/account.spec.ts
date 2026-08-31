import { Account } from './account';
import { AccountType } from './account-type';

describe('Account', () => {
  it('should create an account', () => {
    const account = Account.create(
      'account-1',
      'company-1',
      'Bank',
      AccountType.ASSET,
    );

    expect(account.getId()).toBe('account-1');
    expect(account.getCompanyId()).toBe('company-1');
    expect(account.getName()).toBe('Bank');
    expect(account.getType()).toBe(AccountType.ASSET);
  });

  it('should create a revenue account', () => {
    const account = Account.create(
      'account-2',
      'company-1',
      'Sales Revenue',
      AccountType.REVENUE,
    );

    expect(account.getType()).toBe(AccountType.REVENUE);
  });

  it('should reject empty company id', () => {
    expect(() =>
      Account.create(
        'account-1',
        '',
        'Cash',
        AccountType.ASSET,
      ),
    ).toThrow('Company ID cannot be empty');
  });
});