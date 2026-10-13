// Runs work atomically across repositories: either every write inside
// run() is committed, or none is. Needed when one use case changes more
// than one aggregate (e.g. issuing an invoice creates a journal entry).
export interface UnitOfWork {
    run<T>(work: () => Promise<T>): Promise<T>;
}
