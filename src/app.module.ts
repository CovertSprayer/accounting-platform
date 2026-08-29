import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/database/database.module';
import { CompanyModule } from './application/company/company.module';

@Module({
    imports: [
        DatabaseModule,
        CompanyModule,
    ],
})
export class AppModule {}
