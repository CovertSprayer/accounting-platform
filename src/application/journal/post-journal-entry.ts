import { JournalEntryRepository } from "../../domain/journal/journal-entry-repository";

export class PostJournalEntry {
    constructor(
        private readonly repository: JournalEntryRepository,
    ) { }

    async execute(id: string): Promise<void> {
        const entry = await this.repository.findById(id);
        if (!entry) {
            throw new Error(`Journal entry not found: ${id}`);
        }
        entry.post();
        await this.repository.save(entry);
    }
}
