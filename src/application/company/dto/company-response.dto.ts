import { Company } from "src/domain/company/company";

export class CompanyResponseDto {
    id: string;
    name: string;

    static fromDomain(
        company: Company,
    ): CompanyResponseDto {
        return {
            id: company.getId(),
            name: company.getName(),
        };
    }
}