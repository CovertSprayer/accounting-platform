import { InMemoryUnitOfWork } from './in-memory-unit-of-work';

describe('InMemoryUnitOfWork', () => {
    it('should run the work and return its result', async () => {
        await expect(new InMemoryUnitOfWork().run(async () => 'done')).resolves.toBe('done');
    });

    it('should propagate errors unchanged', async () => {
        const error = new Error('boom');

        await expect(
            new InMemoryUnitOfWork().run(async () => {
                throw error;
            }),
        ).rejects.toBe(error);
    });
});
