import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

// Holds the transaction opened by PrismaUnitOfWork for the current async call chain.
// AsyncLocalStorage keeps concurrent requests apart: each run() sees only its own client.
@Injectable()
export class PrismaTransactionContext {
    private readonly storage = new AsyncLocalStorage<Prisma.TransactionClient>();

    current(): Prisma.TransactionClient | undefined {
        return this.storage.getStore();
    }

    // Only PrismaUnitOfWork should call this.
    run<T>(tx: Prisma.TransactionClient, work: () => Promise<T>): Promise<T> {
        return this.storage.run(tx, work);
    }

    // For reads: the active transaction if there is one, otherwise the root client.
    client(root: PrismaService): Prisma.TransactionClient {
        return this.current() ?? root;
    }

    // For writes that must be atomic on their own (e.g. an entry and its lines).
    // Inside a unit of work, reuse its transaction: calling root.$transaction there
    // would open a second, independent transaction that commits by itself.
    transaction<T>(
        root: PrismaService,
        work: (tx: Prisma.TransactionClient) => Promise<T>,
    ): Promise<T> {
        const active = this.current();

        if (active) {
            return work(active);
        }

        return root.$transaction((tx) => work(tx));
    }
}
