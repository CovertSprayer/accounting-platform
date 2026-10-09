import { Customer } from '../../domain/customer/customer';
import { InMemoryCustomerRepository } from '../../infrastructure/persistence/in-memory-customer-repository';
import { GetCustomer } from './get-customer';

describe('GetCustomer', () => {
    it('should return a customer by id', async () => {
        const repository = new InMemoryCustomerRepository();

        await repository.save(
            'company-1',
            Customer.create('customer-1', 'company-1', 'Acme Ltd', 'ap@acme.com'),
        );

        const useCase = new GetCustomer(repository);

        const result = await useCase.execute('company-1', 'customer-1');

        expect(result).not.toBeNull();
        expect(result!.getId()).toBe('customer-1');
        expect(result!.getName()).toBe('Acme Ltd');
        expect(result!.getEmail()).toBe('ap@acme.com');
    });

    it('should return null when customer does not exist', async () => {
        const repository = new InMemoryCustomerRepository();

        const useCase = new GetCustomer(repository);

        const result = await useCase.execute('company-1', 'does-not-exist');

        expect(result).toBeNull();
    });

    it('should not return a customer belonging to another company', async () => {
        const repository = new InMemoryCustomerRepository();

        await repository.save(
            'company-1',
            Customer.create('customer-1', 'company-1', 'Acme Ltd'),
        );

        const useCase = new GetCustomer(repository);

        const result = await useCase.execute('company-2', 'customer-1');

        expect(result).toBeNull();
    });
});
