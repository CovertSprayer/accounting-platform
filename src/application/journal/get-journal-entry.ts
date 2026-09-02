import { JournalEntry } from '../../domain/journal/journal-entry';
import { JournalEntryRepository } from '../../domain/journal/journal-entry-repository';

export class GetJournalEntry {
    constructor(
        private readonly repository: JournalEntryRepository,
    ) { }

    async execute(
        companyId: string,
        journalEntryId: string,
    ): Promise<JournalEntry | null> {
        return this.repository.findById(
            companyId,
            journalEntryId,
        );
    }
}