import { Account } from './account';

export interface AccountRepository {
    save(companyId: string, account: Account): Promise<void>;
    findById(companyId: string, id: string): Promise<Account | null>;
    findAll(companyId: string): Promise<Account[]>;
}