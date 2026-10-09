import { Customer } from './customer';

export interface CustomerRepository {
    save(companyId: string, customer: Customer): Promise<void>;
    findById(companyId: string, id: string): Promise<Customer | null>;
    findAll(companyId: string): Promise<Customer[]>;
    findByEmail(companyId: string, email: string): Promise<Customer | null>;
}
