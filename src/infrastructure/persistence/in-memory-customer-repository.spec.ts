import { Customer } from '../../domain/customer/customer';
import { InMemoryCustomerRepository } from './in-memory-customer-repository';

describe('InMemoryCustomerRepository', () => {
    it('should save and retrieve a customer by id', async () => {
        const repository = new InMemoryCustomerRepository();

        const customer = Customer.create(
            'customer-1',
            'company-1',
            'Acme Ltd',
            'ap@acme.com',
            '+1 555 0100',
        );

        await repository.save('company-1', customer);

        const found = await repository.findById('company-1', 'customer-1');

        expect(found).not.toBeNull();
        expect(found?.getName()).toBe('Acme Ltd');
        expect(found?.getEmail()).toBe('ap@acme.com');
        expect(found?.getPhone()).toBe('+1 555 0100');
    });

    it('should return null when the customer does not exist', async () => {
        const repository = new InMemoryCustomerRepository();

        const found = await repository.findById('company-1', 'missing');

        expect(found).toBeNull();
    });

    it('should not find a customer by id from another company', async () => {
        const repository = new InMemoryCustomerRepository();

        await repository.save(
            'company-1',
            Customer.create('customer-1', 'company-1', 'Acme Ltd'),
        );

        const found = await repository.findById('company-2', 'customer-1');

        expect(found).toBeNull();
    });

    it('should return all customers for a company only', async () => {
        const repository = new InMemoryCustomerRepository();

        await repository.save(
            'company-1',
            Customer.create('customer-1', 'company-1', 'Acme Ltd'),
        );
        await repository.save(
            'company-1',
            Customer.create('customer-2', 'company-1', 'Globex'),
        );
        await repository.save(
            'company-2',
            Customer.create('customer-1', 'company-2', 'Initech'),
        );

        const customers = await repository.findAll('company-1');

        expect(customers).toHaveLength(2);
        expect(customers.map(customer => customer.getName()))
            .toEqual(expect.arrayContaining(['Acme Ltd', 'Globex']));
    });

    it('should return an empty array when the company has no customers', async () => {
        const repository = new InMemoryCustomerRepository();

        const customers = await repository.findAll('company-1');

        expect(customers).toEqual([]);
    });

    it('should find a customer by email within the same company', async () => {
        const repository = new InMemoryCustomerRepository();

        await repository.save(
            'company-1',
            Customer.create('customer-1', 'company-1', 'Acme Ltd', 'ap@acme.com'),
        );

        const found = await repository.findByEmail('company-1', 'ap@acme.com');

        expect(found?.getId()).toBe('customer-1');
    });

    it('should not find a customer by email from another company', async () => {
        const repository = new InMemoryCustomerRepository();

        await repository.save(
            'company-1',
            Customer.create('customer-1', 'company-1', 'Acme Ltd', 'ap@acme.com'),
        );

        const found = await repository.findByEmail('company-2', 'ap@acme.com');

        expect(found).toBeNull();
    });

    it('should not match customers without an email', async () => {
        const repository = new InMemoryCustomerRepository();

        await repository.save(
            'company-1',
            Customer.create('customer-1', 'company-1', 'Acme Ltd'),
        );

        const found = await repository.findByEmail('company-1', 'ap@acme.com');

        expect(found).toBeNull();
    });
});
