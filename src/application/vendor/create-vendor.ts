import { Vendor } from '../../domain/vendor/vendor';
import { VendorRepository } from '../../domain/vendor/vendor-repository';
import { VendorEmailAlreadyExistsError } from '../../domain/vendor/vendor-email-already-exists.error';

export class CreateVendor {
    constructor(
        private readonly repository: VendorRepository,
    ) { }

    async execute(
        companyId: string,
        id: string,
        name: string,
        email?: string | null,
        phone?: string | null,
    ): Promise<Vendor> {
        const vendor = Vendor.create(id, companyId, name, email, phone);

        const vendorEmail = vendor.getEmail();

        if (vendorEmail !== null) {
            const existing = await this.repository.findByEmail(companyId, vendorEmail);

            if (existing) {
                throw new VendorEmailAlreadyExistsError(companyId, vendorEmail);
            }
        }

        await this.repository.save(companyId, vendor);
        return vendor;
    }
}
