import { Account } from '../../domain/account/account';
import { AccountRepository } from '../../domain/account/account-repository';

export class GetAccount {
    constructor(
        private readonly repository: AccountRepository,
    ) { }

    async execute(
        companyId: string,
        accountId: string,
    ): Promise<Account | null> {
        return this.repository.findById(companyId, accountId);
    }
}