import { Vendor } from 'src/domain/vendor/vendor';

export class VendorResponseDto {
    id: string;
    companyId: string;
    name: string;
    email: string | null;
    phone: string | null;

    static fromDomain(
        vendor: Vendor,
    ): VendorResponseDto {
        return {
            id: vendor.getId(),
            companyId: vendor.getCompanyId(),
            name: vendor.getName(),
            email: vendor.getEmail(),
            phone: vendor.getPhone(),
        };
    }
}
