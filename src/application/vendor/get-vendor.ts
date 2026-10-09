import { Vendor } from '../../domain/vendor/vendor';
import { VendorRepository } from '../../domain/vendor/vendor-repository';

export class GetVendor {
    constructor(
        private readonly repository: VendorRepository,
    ) { }

    async execute(
        companyId: string,
        vendorId: string,
    ): Promise<Vendor | null> {
        return this.repository.findById(companyId, vendorId);
    }
}
