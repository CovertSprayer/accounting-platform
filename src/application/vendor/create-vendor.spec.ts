import { InMemoryVendorRepository } from '../../infrastructure/persistence/in-memory-vendor-repository';
import { VendorEmailAlreadyExistsError } from '../../domain/vendor/vendor-email-already-exists.error';
import { CreateVendor } from './create-vendor';

describe('CreateVendor', () => {
    it('should create and save a vendor', async () => {
        const repository = new InMemoryVendorRepository();
        const useCase = new CreateVendor(repository);

        await useCase.execute(
            'company-1',
            'vendor-1',
            'Office Supplies Co',
            'billing@supplies.com',
            '+1 555 0100',
        );

        const vendor = await repository.findById('company-1', 'vendor-1');

        expect(vendor).not.toBeNull();
        expect(vendor?.getCompanyId()).toBe('company-1');
        expect(vendor?.getName()).toBe('Office Supplies Co');
        expect(vendor?.getEmail()).toBe('billing@supplies.com');
        expect(vendor?.getPhone()).toBe('+1 555 0100');
    });

    it('should reject a duplicate email within the same company', async () => {
        const repository = new InMemoryVendorRepository();
        const useCase = new CreateVendor(repository);

        await useCase.execute('company-1', 'vendor-1', 'Office Supplies Co', 'billing@supplies.com');

        await expect(
            useCase.execute('company-1', 'vendor-2', 'Office Supplies Again', 'billing@supplies.com'),
        ).rejects.toThrow(VendorEmailAlreadyExistsError);

        expect(await repository.findById('company-1', 'vendor-2')).toBeNull();
    });

    it('should treat emails differing only by case or whitespace as duplicates', async () => {
        const repository = new InMemoryVendorRepository();
        const useCase = new CreateVendor(repository);

        await useCase.execute('company-1', 'vendor-1', 'Office Supplies Co', 'billing@supplies.com');

        await expect(
            useCase.execute('company-1', 'vendor-2', 'Office Supplies Again', '  BILLING@Supplies.COM '),
        ).rejects.toThrow(VendorEmailAlreadyExistsError);
    });

    it('should allow the same email in a different company', async () => {
        const repository = new InMemoryVendorRepository();
        const useCase = new CreateVendor(repository);

        await useCase.execute('company-1', 'vendor-1', 'Office Supplies Co', 'billing@supplies.com');
        await useCase.execute('company-2', 'vendor-1', 'Office Supplies Co', 'billing@supplies.com');

        expect(await repository.findById('company-1', 'vendor-1')).not.toBeNull();
        expect(await repository.findById('company-2', 'vendor-1')).not.toBeNull();
    });

    it('should allow multiple vendors without an email in the same company', async () => {
        const repository = new InMemoryVendorRepository();
        const useCase = new CreateVendor(repository);

        await useCase.execute('company-1', 'vendor-1', 'Office Supplies Co');
        await useCase.execute('company-1', 'vendor-2', 'Globex', null);

        expect(await repository.findAll('company-1')).toHaveLength(2);
    });

    it('should not save a vendor that violates domain invariants', async () => {
        const repository = new InMemoryVendorRepository();
        const useCase = new CreateVendor(repository);

        await expect(
            useCase.execute('company-1', 'vendor-1', 'Office Supplies Co', 'not-an-email'),
        ).rejects.toThrow('Invalid vendor email');

        expect(await repository.findAll('company-1')).toEqual([]);
    });
});
