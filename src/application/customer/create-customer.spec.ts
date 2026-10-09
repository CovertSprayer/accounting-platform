import { InMemoryCustomerRepository } from '../../infrastructure/persistence/in-memory-customer-repository';
import { CustomerEmailAlreadyExistsError } from '../../domain/customer/customer-email-already-exists.error';
import { CreateCustomer } from './create-customer';

describe('CreateCustomer', () => {
    it('should create and save a customer', async () => {
        const repository = new InMemoryCustomerRepository();
        const useCase = new CreateCustomer(repository);

        await useCase.execute(
            'company-1',
            'customer-1',
            'Acme Ltd',
            'ap@acme.com',
            '+1 555 0100',
        );

        const customer = await repository.findById('company-1', 'customer-1');

        expect(customer).not.toBeNull();
        expect(customer?.getCompanyId()).toBe('company-1');
        expect(customer?.getName()).toBe('Acme Ltd');
        expect(customer?.getEmail()).toBe('ap@acme.com');
        expect(customer?.getPhone()).toBe('+1 555 0100');
    });

    it('should reject a duplicate email within the same company', async () => {
        const repository = new InMemoryCustomerRepository();
        const useCase = new CreateCustomer(repository);

        await useCase.execute('company-1', 'customer-1', 'Acme Ltd', 'ap@acme.com');

        await expect(
            useCase.execute('company-1', 'customer-2', 'Acme Again', 'ap@acme.com'),
        ).rejects.toThrow(CustomerEmailAlreadyExistsError);

        expect(await repository.findById('company-1', 'customer-2')).toBeNull();
    });

    it('should treat emails differing only by case or whitespace as duplicates', async () => {
        const repository = new InMemoryCustomerRepository();
        const useCase = new CreateCustomer(repository);

        await useCase.execute('company-1', 'customer-1', 'Acme Ltd', 'ap@acme.com');

        await expect(
            useCase.execute('company-1', 'customer-2', 'Acme Again', '  AP@Acme.COM '),
        ).rejects.toThrow(CustomerEmailAlreadyExistsError);
    });

    it('should allow the same email in a different company', async () => {
        const repository = new InMemoryCustomerRepository();
        const useCase = new CreateCustomer(repository);

        await useCase.execute('company-1', 'customer-1', 'Acme Ltd', 'ap@acme.com');
        await useCase.execute('company-2', 'customer-1', 'Acme Ltd', 'ap@acme.com');

        expect(await repository.findById('company-1', 'customer-1')).not.toBeNull();
        expect(await repository.findById('company-2', 'customer-1')).not.toBeNull();
    });

    it('should allow multiple customers without an email in the same company', async () => {
        const repository = new InMemoryCustomerRepository();
        const useCase = new CreateCustomer(repository);

        await useCase.execute('company-1', 'customer-1', 'Acme Ltd');
        await useCase.execute('company-1', 'customer-2', 'Globex', null);

        expect(await repository.findAll('company-1')).toHaveLength(2);
    });

    it('should not save a customer that violates domain invariants', async () => {
        const repository = new InMemoryCustomerRepository();
        const useCase = new CreateCustomer(repository);

        await expect(
            useCase.execute('company-1', 'customer-1', 'Acme Ltd', 'not-an-email'),
        ).rejects.toThrow('Invalid customer email');

        expect(await repository.findAll('company-1')).toEqual([]);
    });
});
