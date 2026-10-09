import { Vendor } from '../../domain/vendor/vendor';
import { VendorRepository } from '../../domain/vendor/vendor-repository';

export class ListVendors {
    constructor(
        private readonly repository: VendorRepository,
    ) { }

    async execute(companyId: string): Promise<Vendor[]> {
        return this.repository.findAll(companyId);
    }
}
