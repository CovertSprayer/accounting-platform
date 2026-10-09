import { Vendor } from '../../domain/vendor/vendor';
import { InMemoryVendorRepository } from './in-memory-vendor-repository';

describe('InMemoryVendorRepository', () => {
    it('should save and retrieve a vendor by id', async () => {
        const repository = new InMemoryVendorRepository();

        const vendor = Vendor.create(
            'vendor-1',
            'company-1',
            'Office Supplies Co',
            'billing@supplies.com',
            '+1 555 0100',
        );

        await repository.save('company-1', vendor);

        const found = await repository.findById('company-1', 'vendor-1');

        expect(found).not.toBeNull();
        expect(found?.getName()).toBe('Office Supplies Co');
        expect(found?.getEmail()).toBe('billing@supplies.com');
        expect(found?.getPhone()).toBe('+1 555 0100');
    });

    it('should return null when the vendor does not exist', async () => {
        const repository = new InMemoryVendorRepository();

        const found = await repository.findById('company-1', 'missing');

        expect(found).toBeNull();
    });

    it('should not find a vendor by id from another company', async () => {
        const repository = new InMemoryVendorRepository();

        await repository.save(
            'company-1',
            Vendor.create('vendor-1', 'company-1', 'Office Supplies Co'),
        );

        const found = await repository.findById('company-2', 'vendor-1');

        expect(found).toBeNull();
    });

    it('should return all vendors for a company only', async () => {
        const repository = new InMemoryVendorRepository();

        await repository.save(
            'company-1',
            Vendor.create('vendor-1', 'company-1', 'Office Supplies Co'),
        );
        await repository.save(
            'company-1',
            Vendor.create('vendor-2', 'company-1', 'Globex'),
        );
        await repository.save(
            'company-2',
            Vendor.create('vendor-1', 'company-2', 'Initech'),
        );

        const vendors = await repository.findAll('company-1');

        expect(vendors).toHaveLength(2);
        expect(vendors.map(vendor => vendor.getName()))
            .toEqual(expect.arrayContaining(['Office Supplies Co', 'Globex']));
    });

    it('should return an empty array when the company has no vendors', async () => {
        const repository = new InMemoryVendorRepository();

        const vendors = await repository.findAll('company-1');

        expect(vendors).toEqual([]);
    });

    it('should find a vendor by email within the same company', async () => {
        const repository = new InMemoryVendorRepository();

        await repository.save(
            'company-1',
            Vendor.create('vendor-1', 'company-1', 'Office Supplies Co', 'billing@supplies.com'),
        );

        const found = await repository.findByEmail('company-1', 'billing@supplies.com');

        expect(found?.getId()).toBe('vendor-1');
    });

    it('should not find a vendor by email from another company', async () => {
        const repository = new InMemoryVendorRepository();

        await repository.save(
            'company-1',
            Vendor.create('vendor-1', 'company-1', 'Office Supplies Co', 'billing@supplies.com'),
        );

        const found = await repository.findByEmail('company-2', 'billing@supplies.com');

        expect(found).toBeNull();
    });

    it('should not match vendors without an email', async () => {
        const repository = new InMemoryVendorRepository();

        await repository.save(
            'company-1',
            Vendor.create('vendor-1', 'company-1', 'Office Supplies Co'),
        );

        const found = await repository.findByEmail('company-1', 'billing@supplies.com');

        expect(found).toBeNull();
    });
});
