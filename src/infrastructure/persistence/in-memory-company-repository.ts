import { Company } from '../../domain/company/company';
import { CompanyRepository } from '../../domain/company/company-repository';

export class InMemoryCompanyRepository implements CompanyRepository {
    private readonly companies = new Map<string, Company>();

    async save(company: Company): Promise<void> {
        this.companies.set(company.getId(), company);
    }

    async findById(id: string): Promise<Company | null> {
        return this.companies.get(id) ?? null;
    }
}