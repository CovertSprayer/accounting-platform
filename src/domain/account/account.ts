import { AccountType } from './account-type';

export class Account {
    constructor(
        private readonly id: string,
        private readonly name: string,
        private readonly type: AccountType,
    ) { }

    getId(): string {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getType(): AccountType {
        return this.type;
    }

    static create(
        id: string,
        name: string,
        type: AccountType,
    ): Account {
        if (!name.trim()) {
            throw new Error('Account name cannot be empty');
        }

        return new Account(id, name, type);
    }
}