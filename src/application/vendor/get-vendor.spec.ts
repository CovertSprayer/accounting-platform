import { Vendor } from '../../domain/vendor/vendor';
import { InMemoryVendorRepository } from '../../infrastructure/persistence/in-memory-vendor-repository';
import { GetVendor } from './get-vendor';

describe('GetVendor', () => {
    it('should return a vendor by id', async () => {
        const repository = new InMemoryVendorRepository();

        await repository.save(
            'company-1',
            Vendor.create('vendor-1', 'company-1', 'Office Supplies Co', 'billing@supplies.com'),
        );

        const useCase = new GetVendor(repository);

        const result = await useCase.execute('company-1', 'vendor-1');

        expect(result).not.toBeNull();
        expect(result!.getId()).toBe('vendor-1');
        expect(result!.getName()).toBe('Office Supplies Co');
        expect(result!.getEmail()).toBe('billing@supplies.com');
    });

    it('should return null when vendor does not exist', async () => {
        const repository = new InMemoryVendorRepository();

        const useCase = new GetVendor(repository);

        const result = await useCase.execute('company-1', 'does-not-exist');

        expect(result).toBeNull();
    });

    it('should not return a vendor belonging to another company', async () => {
        const repository = new InMemoryVendorRepository();

        await repository.save(
            'company-1',
            Vendor.create('vendor-1', 'company-1', 'Office Supplies Co'),
        );

        const useCase = new GetVendor(repository);

        const result = await useCase.execute('company-2', 'vendor-1');

        expect(result).toBeNull();
    });
});
