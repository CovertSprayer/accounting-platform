import { Customer } from '../../domain/customer/customer';
import { CustomerRepository } from '../../domain/customer/customer-repository';

export class GetCustomer {
    constructor(
        private readonly repository: CustomerRepository,
    ) { }

    async execute(
        companyId: string,
        customerId: string,
    ): Promise<Customer | null> {
        return this.repository.findById(companyId, customerId);
    }
}
