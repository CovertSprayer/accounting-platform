import { Vendor } from './vendor';

export interface VendorRepository {
    save(companyId: string, vendor: Vendor): Promise<void>;
    findById(companyId: string, id: string): Promise<Vendor | null>;
    findAll(companyId: string): Promise<Vendor[]>;
    findByEmail(companyId: string, email: string): Promise<Vendor | null>;
}
