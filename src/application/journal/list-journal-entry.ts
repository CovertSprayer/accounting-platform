import { JournalEntry } from "src/domain/journal/journal-entry";
import { JournalEntryRepository } from "src/domain/journal/journal-entry-repository";

export class ListJournalEntry {
    constructor(
        private readonly journalEntryRepository: JournalEntryRepository
    ) {}

    async execute(companyId: string): Promise<JournalEntry[]> {
        return this.journalEntryRepository.findAll(companyId);
    }
}