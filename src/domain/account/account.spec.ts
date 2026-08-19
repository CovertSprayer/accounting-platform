import { Account } from './account';
import { AccountType } from './account-type';

describe('Account', () => {
  it('should create an account', () => {
    const account = Account.create(
      'account-1',
      'Bank',
      AccountType.ASSET,
    );

    expect(account.getId()).toBe('account-1');
    expect(account.getName()).toBe('Bank');
    expect(account.getType()).toBe(AccountType.ASSET);
  });

  it('should create a revenue account', () => {
    const account = Account.create(
      'account-2',
      'Sales Revenue',
      AccountType.REVENUE,
    );

    expect(account.getType()).toBe(AccountType.REVENUE);
  });
});