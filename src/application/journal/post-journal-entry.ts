import { JournalEntry } from "src/domain/journal/journal-entry";
import { JournalEntryRepository } from "../../domain/journal/journal-entry-repository";
import { NotFoundError } from "../shared/not-found.error";

export class PostJournalEntry {
    constructor(
        private readonly repository: JournalEntryRepository,
    ) { }

    async execute(companyId: string, id: string): Promise<JournalEntry> {
        const entry = await this.repository.findById(companyId, id);
        if (!entry) {
            throw new NotFoundError(`Journal entry not found: ${id}`);
        }

        entry.post();
        await this.repository.save(companyId, entry);

        return entry;
    }
}
