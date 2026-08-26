import { JournalEntry } from './journal-entry';

export interface JournalEntryRepository {
  save(entry: JournalEntry): Promise<void>;
  findById(id: string): Promise<JournalEntry | null>;
}