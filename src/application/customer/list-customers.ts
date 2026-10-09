import { Customer } from '../../domain/customer/customer';
import { CustomerRepository } from '../../domain/customer/customer-repository';

export class ListCustomers {
    constructor(
        private readonly repository: CustomerRepository,
    ) { }

    async execute(companyId: string): Promise<Customer[]> {
        return this.repository.findAll(companyId);
    }
}
