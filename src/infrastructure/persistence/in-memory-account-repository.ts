import { Account } from '../../domain/account/account';
import { AccountRepository } from '../../domain/account/account-repository';

export class InMemoryAccountRepository implements AccountRepository {
    private readonly accounts = new Map<string, Account>();

    async save(companyId: string, account: Account): Promise<void> {
        this.accounts.set(
            `${companyId}:${account.getId()}`,
            account,
        );
    }

    async findById(companyId: string, id: string): Promise<Account | null> {
        return this.accounts.get(`${companyId}:${id}`) ?? null;
    }
}