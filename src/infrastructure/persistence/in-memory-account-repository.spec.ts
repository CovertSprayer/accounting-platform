import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { InMemoryAccountRepository } from './in-memory-account-repository';

describe('InMemoryAccountRepository', () => {
    it('should save and retrieve all accounts for a company', async () => {
        const repository = new InMemoryAccountRepository();

        const cash = Account.create(
            'account-1',
            'company-1',
            'Cash',
            AccountType.ASSET,
        );

        const revenue = Account.create(
            'account-2',
            'company-1',
            'Revenue',
            AccountType.REVENUE,
        );

        await repository.save('company-1', cash);
        await repository.save('company-1', revenue);

        const accounts = await repository.findAll('company-1');

        expect(accounts).toHaveLength(2);
        expect(accounts.map(account => account.getId()))
            .toEqual(expect.arrayContaining(['account-1', 'account-2']));
    });

    it('should return an empty array when the company has no accounts', async () => {
        const repository = new InMemoryAccountRepository();

        const accounts = await repository.findAll('company-1');

        expect(accounts).toEqual([]);
    });

    it('should not return accounts belonging to another company', async () => {
        const repository = new InMemoryAccountRepository();

        const company1Cash = Account.create(
            'account-1',
            'company-1',
            'Cash',
            AccountType.ASSET,
        );

        const company2Cash = Account.create(
            'account-1',
            'company-2',
            'Cash',
            AccountType.ASSET,
        );

        await repository.save('company-1', company1Cash);
        await repository.save('company-2', company2Cash);

        const company1Accounts = await repository.findAll('company-1');

        expect(company1Accounts).toHaveLength(1);
        expect(company1Accounts[0].getId()).toBe('account-1');
        expect(company1Accounts[0].getName()).toBe('Cash');
    });

});
