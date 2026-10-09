import { Customer } from 'src/domain/customer/customer';

export class CustomerResponseDto {
    id: string;
    companyId: string;
    name: string;
    email: string | null;
    phone: string | null;

    static fromDomain(
        customer: Customer,
    ): CustomerResponseDto {
        return {
            id: customer.getId(),
            companyId: customer.getCompanyId(),
            name: customer.getName(),
            email: customer.getEmail(),
            phone: customer.getPhone(),
        };
    }
}
