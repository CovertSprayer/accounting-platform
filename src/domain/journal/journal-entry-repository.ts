import { JournalEntry } from './journal-entry';

export interface JournalEntryRepository {
  save(companyId: string, entry: JournalEntry): Promise<void>;
  findById(companyId: string, id: string): Promise<JournalEntry | null>;
  findAll(
    companyId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<JournalEntry[]>
}