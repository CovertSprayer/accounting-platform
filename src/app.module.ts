import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DatabaseModule } from './infrastructure/database/database.module';
import { DomainValidationErrorFilter } from './infrastructure/http/domain-validation-error.filter';
import { NotFoundErrorFilter } from './infrastructure/http/not-found-error.filter';
import { CompanyModule } from './application/company/company.module';
import { AccountModule } from './application/account/account.module';
import { JournalModule } from './application/journal/journal.module';
import { FinancialStatementsModule } from './application/financial-statements/financial-statements.module';
import { CustomerModule } from './application/customer/customer.module';
import { VendorModule } from './application/vendor/vendor.module';

@Module({
    imports: [
        DatabaseModule,
        CompanyModule,
        AccountModule,
        JournalModule,
        FinancialStatementsModule,
        CustomerModule,
        VendorModule,
    ],
    providers: [
        {
            provide: APP_FILTER,
            useClass: DomainValidationErrorFilter,
        },
        {
            provide: APP_FILTER,
            useClass: NotFoundErrorFilter,
        },
    ],
})
export class AppModule {}
