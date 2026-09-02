import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { InMemoryAccountRepository } from '../../infrastructure/persistence/in-memory-account-repository';
import { ListAccounts } from './list-accounts';

describe('ListAccounts', () => {
    it('should return all accounts for a company', async () => {
        const repository = new InMemoryAccountRepository();

        const bank = Account.create(
            'account-1',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const revenue = Account.create(
            'account-2',
            'company-1',
            'Sales Revenue',
            AccountType.REVENUE,
        );

        await repository.save('company-1', bank);
        await repository.save('company-1', revenue);

        const useCase = new ListAccounts(repository);

        const accounts = await useCase.execute('company-1');

        expect(accounts).toHaveLength(2);
        expect(accounts.map((account) => account.getId())).toEqual([
            'account-1',
            'account-2',
        ]);
    });

    it('should return an empty array when company has no accounts', async () => {
        const repository = new InMemoryAccountRepository();

        const useCase = new ListAccounts(repository);

        const accounts = await useCase.execute('company-1');

        expect(accounts).toEqual([]);
    });

    it('should only return accounts belonging to the company', async () => {
        const repository = new InMemoryAccountRepository();

        const companyOneAccount = Account.create(
            'account-1',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        const companyTwoAccount = Account.create(
            'account-2',
            'company-2',
            'Bank',
            AccountType.ASSET,
        );

        await repository.save('company-1', companyOneAccount);
        await repository.save('company-2', companyTwoAccount);

        const useCase = new ListAccounts(repository);

        const accounts = await useCase.execute('company-1');

        expect(accounts).toHaveLength(1);
        expect(accounts[0].getId()).toBe('account-1');
    });
});