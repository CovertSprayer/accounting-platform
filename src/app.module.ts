import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { CompanyModule } from './application/company/company.module';
import { AccountModule } from './application/account/account.module';

@Module({
    imports: [
        DatabaseModule,
        CompanyModule,
        AccountModule,
    ],
})
export class AppModule {}
