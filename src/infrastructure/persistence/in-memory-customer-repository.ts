import { Customer } from '../../domain/customer/customer';
import { CustomerRepository } from '../../domain/customer/customer-repository';

export class InMemoryCustomerRepository implements CustomerRepository {
    private readonly customers = new Map<string, Customer>();

    async save(companyId: string, customer: Customer): Promise<void> {
        this.customers.set(
            `${companyId}:${customer.getId()}`,
            customer,
        );
    }

    async findById(companyId: string, id: string): Promise<Customer | null> {
        return this.customers.get(`${companyId}:${id}`) ?? null;
    }

    async findAll(companyId: string): Promise<Customer[]> {
        const prefix = `${companyId}:`;

        return Array.from(this.customers.entries())
            .filter(([key]) => key.startsWith(prefix))
            .map(([, customer]) => customer);
    }

    async findByEmail(companyId: string, email: string): Promise<Customer | null> {
        const customers = await this.findAll(companyId);

        return customers.find(customer => customer.getEmail() === email) ?? null;
    }
}
