import { Account } from '../../domain/account/account';
import { AccountType } from '../../domain/account/account-type';
import { InMemoryAccountRepository } from '../../infrastructure/persistence/in-memory-account-repository';
import { GetAccount } from './get-account';

describe('GetAccount', () => {
    it('should return an account by id', async () => {
        const repository = new InMemoryAccountRepository();

        const account = Account.create(
            'account-1',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        await repository.save('company-1', account);

        const useCase = new GetAccount(repository);

        const result = await useCase.execute(
            'company-1',
            'account-1',
        );

        expect(result).not.toBeNull();
        expect(result!.getId()).toBe('account-1');
        expect(result!.getName()).toBe('Bank');
        expect(result!.getType()).toBe(AccountType.ASSET);
    });

    it('should return null when account does not exist', async () => {
        const repository = new InMemoryAccountRepository();

        const useCase = new GetAccount(repository);

        const result = await useCase.execute(
            'company-1',
            'does-not-exist',
        );

        expect(result).toBeNull();
    });

    it('should not return an account belonging to another company', async () => {
        const repository = new InMemoryAccountRepository();

        const account = Account.create(
            'account-1',
            'company-1',
            'Bank',
            AccountType.ASSET,
        );

        await repository.save('company-1', account);

        const useCase = new GetAccount(repository);

        const result = await useCase.execute(
            'company-2',
            'account-1',
        );

        expect(result).toBeNull();
    });
});