import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

import { Company } from '../../../domain/company/company';
import { CompanyRepository } from '../../../domain/company/company-repository';

@Injectable()
export class PrismaCompanyRepository implements CompanyRepository {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async save(company: Company): Promise<void> {
        await this.prisma.company.upsert({
            where: {
                id: company.getId(),
            },
            create: {
                id: company.getId(),
                name: company.getName(),
            },
            update: {
                name: company.getName(),
            },
        });
    }

    async findById(
        id: string,
    ): Promise<Company | null> {
        const data = await this.prisma.company.findUnique({
            where: {
                id,
            },
        });

        if (!data) {
            return null;
        }

        return Company.create(
            data.id,
            data.name,
        );
    }
}

/**
 * Notice something important

We don't expose the Prisma model:

❌ Promise<PrismaCompany>

Instead:

✅ Promise<Company>

The repository translates:

Prisma Company
      ↓
  Company

This is exactly what the Infrastructure layer is supposed to do.
 */