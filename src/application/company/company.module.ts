import { Module } from '@nestjs/common';

import { CreateCompany } from './create-company';
import { CompanyRepository } from '../../domain/company/company-repository';

import { PrismaCompanyRepository } from '../../infrastructure/persistence/prisma/prisma-company-repository';
import { CompanyController } from './company.controller';
// import { PrismaService } from '../../infrastructure/database/prisma.service';

export const COMPANY_REPOSITORY = Symbol(
    'COMPANY_REPOSITORY',
);

@Module({
    controllers: [CompanyController],
    providers: [
        // PrismaService,

        {
            provide: COMPANY_REPOSITORY,
            useClass: PrismaCompanyRepository,
        },

        {
            provide: CreateCompany,
            useFactory: (
                repository: CompanyRepository,
            ) => {
                return new CreateCompany(repository);
            },
            inject: [COMPANY_REPOSITORY],
        },
    ],
    exports: [CreateCompany],
})
export class CompanyModule { }