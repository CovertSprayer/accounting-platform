import { AccountType } from "../../domain/account/account-type";
import { Account } from "../../domain/account/account";
import { AccountRepository } from "../../domain/account/account-repository";

export class CreateAccount {
    constructor(
        private readonly repository: AccountRepository,
    ) { }

    async execute(
        companyId: string,
        id: string,
        name: string,
        type: AccountType
    ): Promise<Account> {
        const account = Account.create(id, name, type);
        await this.repository.save(companyId, account);
        return account;
    }
}