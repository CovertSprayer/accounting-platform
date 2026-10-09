import { Customer } from '../../domain/customer/customer';
import { InMemoryCustomerRepository } from '../../infrastructure/persistence/in-memory-customer-repository';
import { ListCustomers } from './list-customers';

describe('ListCustomers', () => {
    it('should return all customers for a company', async () => {
        const repository = new InMemoryCustomerRepository();

        await repository.save(
            'company-1',
            Customer.create('customer-1', 'company-1', 'Acme Ltd'),
        );
        await repository.save(
            'company-1',
            Customer.create('customer-2', 'company-1', 'Globex'),
        );

        const useCase = new ListCustomers(repository);

        const customers = await useCase.execute('company-1');

        expect(customers).toHaveLength(2);
        expect(customers.map((customer) => customer.getId())).toEqual([
            'customer-1',
            'customer-2',
        ]);
    });

    it('should return an empty array when company has no customers', async () => {
        const repository = new InMemoryCustomerRepository();

        const useCase = new ListCustomers(repository);

        const customers = await useCase.execute('company-1');

        expect(customers).toEqual([]);
    });

    it('should only return customers belonging to the company', async () => {
        const repository = new InMemoryCustomerRepository();

        await repository.save(
            'company-1',
            Customer.create('customer-1', 'company-1', 'Acme Ltd'),
        );
        await repository.save(
            'company-2',
            Customer.create('customer-2', 'company-2', 'Initech'),
        );

        const useCase = new ListCustomers(repository);

        const customers = await useCase.execute('company-1');

        expect(customers).toHaveLength(1);
        expect(customers[0].getId()).toBe('customer-1');
    });
});
