import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaTransactionContext } from './prisma-transaction-context';
import { PrismaUnitOfWork } from './prisma-unit-of-work';
import { UNIT_OF_WORK } from '../../application/shared/unit-of-work.token';

@Global()
@Module({
    providers: [
        PrismaService,
        PrismaTransactionContext,
        {
            provide: UNIT_OF_WORK,
            useClass: PrismaUnitOfWork,
        },
    ],
    exports: [
        PrismaService,
        PrismaTransactionContext,
        UNIT_OF_WORK,
    ],
})
export class DatabaseModule { }
