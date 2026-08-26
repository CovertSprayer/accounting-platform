import { JournalEntry } from '../../domain/journal/journal-entry';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';

export class InMemoryJournalEntryRepository implements JournalEntryRepository {
    private readonly entries = new Map<string, JournalEntry>();

    async save(entry: JournalEntry): Promise<void> {
        this.entries.set(entry.getId(), entry);
    }

    async findById(id: string): Promise<JournalEntry | null> {
        return this.entries.get(id) ?? null;
    }
}