import { Vendor } from '../../domain/vendor/vendor';
import { VendorRepository } from '../../domain/vendor/vendor-repository';

export class InMemoryVendorRepository implements VendorRepository {
    private readonly vendors = new Map<string, Vendor>();

    async save(companyId: string, vendor: Vendor): Promise<void> {
        this.vendors.set(
            `${companyId}:${vendor.getId()}`,
            vendor,
        );
    }

    async findById(companyId: string, id: string): Promise<Vendor | null> {
        return this.vendors.get(`${companyId}:${id}`) ?? null;
    }

    async findAll(companyId: string): Promise<Vendor[]> {
        const prefix = `${companyId}:`;

        return Array.from(this.vendors.entries())
            .filter(([key]) => key.startsWith(prefix))
            .map(([, vendor]) => vendor);
    }

    async findByEmail(companyId: string, email: string): Promise<Vendor | null> {
        const vendors = await this.findAll(companyId);

        return vendors.find(vendor => vendor.getEmail() === email) ?? null;
    }
}
