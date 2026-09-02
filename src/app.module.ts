import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { CompanyModule } from './application/company/company.module';
import { AccountModule } from './application/account/account.module';
import { JournalModule } from './application/journal/journal.module';

@Module({
    imports: [
        DatabaseModule,
        CompanyModule,
        AccountModule,
        JournalModule,
    ],
})
export class AppModule {}
