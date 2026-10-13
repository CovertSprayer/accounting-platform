import { UnitOfWork } from '../../application/shared/unit-of-work';

// For application tests with in-memory repositories. It does not roll back:
// tests that need rollback behaviour run against PrismaUnitOfWork.
export class InMemoryUnitOfWork implements UnitOfWork {
    async run<T>(work: () => Promise<T>): Promise<T> {
        return work();
    }
}
