import { Account } from '../../domain/account/account';
import { AccountRepository } from '../../domain/account/account-repository';

export class ListAccounts {
    constructor(
        private readonly repository: AccountRepository,
    ) { }

    async execute(companyId: string): Promise<Account[]> {
        return this.repository.findAll(companyId);
    }
}