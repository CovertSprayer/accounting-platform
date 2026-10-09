import { Vendor } from '../../domain/vendor/vendor';
import { InMemoryVendorRepository } from '../../infrastructure/persistence/in-memory-vendor-repository';
import { ListVendors } from './list-vendors';

describe('ListVendors', () => {
    it('should return all vendors for a company', async () => {
        const repository = new InMemoryVendorRepository();

        await repository.save(
            'company-1',
            Vendor.create('vendor-1', 'company-1', 'Office Supplies Co'),
        );
        await repository.save(
            'company-1',
            Vendor.create('vendor-2', 'company-1', 'Globex'),
        );

        const useCase = new ListVendors(repository);

        const vendors = await useCase.execute('company-1');

        expect(vendors).toHaveLength(2);
        expect(vendors.map((vendor) => vendor.getId())).toEqual([
            'vendor-1',
            'vendor-2',
        ]);
    });

    it('should return an empty array when company has no vendors', async () => {
        const repository = new InMemoryVendorRepository();

        const useCase = new ListVendors(repository);

        const vendors = await useCase.execute('company-1');

        expect(vendors).toEqual([]);
    });

    it('should only return vendors belonging to the company', async () => {
        const repository = new InMemoryVendorRepository();

        await repository.save(
            'company-1',
            Vendor.create('vendor-1', 'company-1', 'Office Supplies Co'),
        );
        await repository.save(
            'company-2',
            Vendor.create('vendor-2', 'company-2', 'Initech'),
        );

        const useCase = new ListVendors(repository);

        const vendors = await useCase.execute('company-1');

        expect(vendors).toHaveLength(1);
        expect(vendors[0].getId()).toBe('vendor-1');
    });
});
