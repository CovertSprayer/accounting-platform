import { AccountType } from './account-type';

export class Account {
    constructor(
        private readonly id: string,
        private readonly companyId: string,
        private readonly name: string,
        private readonly type: AccountType,
    ) { }

    getId(): string {
        return this.id;
    }

    getCompanyId(): string {
        return this.companyId;
    }

    getName(): string {
        return this.name;
    }

    getType(): AccountType {
        return this.type;
    }

    static create(
        id: string,
        companyId: string,
        name: string,
        type: AccountType,
    ): Account {
        if (!companyId.trim()) {
            throw new Error('Company ID cannot be empty');
        }
        if (!name.trim()) {
            throw new Error('Account name cannot be empty');
        }

        return new Account(id, companyId, name, type);
    }
}