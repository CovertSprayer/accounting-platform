import { Customer } from '../../domain/customer/customer';
import { CustomerRepository } from '../../domain/customer/customer-repository';
import { CustomerEmailAlreadyExistsError } from '../../domain/customer/customer-email-already-exists.error';

export class CreateCustomer {
    constructor(
        private readonly repository: CustomerRepository,
    ) { }

    async execute(
        companyId: string,
        id: string,
        name: string,
        email?: string | null,
        phone?: string | null,
    ): Promise<Customer> {
        const customer = Customer.create(id, companyId, name, email, phone);

        const customerEmail = customer.getEmail();

        if (customerEmail !== null) {
            const existing = await this.repository.findByEmail(companyId, customerEmail);

            if (existing) {
                throw new CustomerEmailAlreadyExistsError(companyId, customerEmail);
            }
        }

        await this.repository.save(companyId, customer);
        return customer;
    }
}
