import { Company } from './company';

export interface CompanyRepository {
    save(company: Company): Promise<void>;
    findById(id: string): Promise<Company | null>;
}

/**
Why an interface?

Our domain/application layer shouldn't care how companies are stored.

Today:

CompanyRepository
      ↓
Prisma
      ↓
PostgreSQL

Later we could have:

CompanyRepository
      ↓
MongoDB

or:

CompanyRepository
      ↓
InMemory

without changing Company.

That's Dependency Inversion from SOLID.
 */