import { Injectable } from '@nestjs/common';
import { UnitOfWork } from '../../application/shared/unit-of-work';
import { PrismaService } from './prisma.service';
import { PrismaTransactionContext } from './prisma-transaction-context';

@Injectable()
export class PrismaUnitOfWork implements UnitOfWork {
    constructor(
        private readonly prisma: PrismaService,
        private readonly context: PrismaTransactionContext,
    ) { }

    // If work throws, Prisma rolls back the transaction and rethrows the same error.
    run<T>(work: () => Promise<T>): Promise<T> {
        // Already inside a unit of work: join it rather than opening another transaction.
        if (this.context.current()) {
            return work();
        }

        return this.prisma.$transaction((tx) => this.context.run(tx, work));
    }
}
