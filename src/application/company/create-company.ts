import { Company } from '../../domain/company/company';
import { CompanyRepository } from '../../domain/company/company-repository';

export class CreateCompany {
    constructor(
        private readonly repository: CompanyRepository,
    ) { }

    async execute(
        id: string,
        name: string,
    ): Promise<void> {
        const company = Company.create(id, name);

        await this.repository.save(company);
    }
}