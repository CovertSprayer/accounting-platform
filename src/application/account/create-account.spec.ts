import { InMemoryAccountRepository } from '../../infrastructure/persistence/in-memory-account-repository';
import { CreateAccount } from './create-account';
import { AccountType } from '../../domain/account/account-type';

describe("CreateAccountUseCase", () => {
    it("should create an account", async () => {
        const repository = new InMemoryAccountRepository();

        const useCase = new CreateAccount(repository);

        await useCase.execute(
            'company-1',
            'account-1',
            'Cash',
            AccountType.ASSET,
        );

        const account = await repository.findById('company-1', 'account-1');

        expect(account).not.toBeNull();
        expect(account?.getId()).toBe('account-1');
        expect(account?.getName()).toBe('Cash');
        expect(account?.getType()).toBe(AccountType.ASSET);
    })
})