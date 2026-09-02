import { JournalEntry } from '../../domain/journal/journal-entry';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';

export class InMemoryJournalEntryRepository implements JournalEntryRepository {
    private readonly entries = new Map<string, JournalEntry>();

    async save(companyId: string, entry: JournalEntry): Promise<void> {
        this.entries.set(`${companyId}:${entry.getId()}`, entry);
    }

    async findById(companyId: string, id: string): Promise<JournalEntry | null> {
        return this.entries.get(`${companyId}:${id}`) ?? null;
    }

    async findAll(companyId: string): Promise<JournalEntry[]> {
        return Array.from(this.entries.entries())
            .filter(([key]) => key.startsWith(`${companyId}:`))
            .map(([, entry]) => entry);
    }
}