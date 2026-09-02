import {
    Body,
    Controller,
    Get,
    NotFoundException,
    Param,
    Post,
    Query,
} from '@nestjs/common';

import {
    CreateJournalEntry,
} from './create-journal-entry';

import {
    PostJournalEntry,
} from './post-journal-entry';

import {
    CreateJournalEntryDto,
} from './dto/create-journal-entry.dto';

import {
    JournalEntryResponseDto,
} from './dto/journal-entry-response.dto';
import { GetJournalEntry } from './get-journal-entry';
import { ListJournalEntry } from './list-journal-entry';

@Controller('journal-entries')
export class JournalController {
    constructor(
        private readonly createJournalEntry: CreateJournalEntry,
        private readonly postJournalEntry: PostJournalEntry,
        private readonly getJournalEntry: GetJournalEntry,
        private readonly listJournalEntry: ListJournalEntry,
    ) { }

    @Post()
    async create(
        @Body() dto: CreateJournalEntryDto,
    ): Promise<JournalEntryResponseDto> {
        const entry = await this.createJournalEntry.execute(
            dto.companyId,
            {
                id: dto.id,
                lines: dto.lines.map((line) => ({
                    accountId: line.accountId,
                    type: line.type,
                    amount: line.amount,
                })),
            },
        );

        return JournalEntryResponseDto.fromDomain(entry);
    }

    @Post(':id/post')
    async post(
        @Param('id') id: string,
        @Body('companyId') companyId: string,
    ): Promise<JournalEntryResponseDto> {
        const entry = await this.postJournalEntry.execute(companyId, id);

        return JournalEntryResponseDto.fromDomain(entry);
    }

    @Get()
    async list(
        @Query('companyId') companyId: string,
    ): Promise<JournalEntryResponseDto[]> {
        const entries = await this.listJournalEntry.execute(companyId);

        return entries.map(JournalEntryResponseDto.fromDomain);
    }

    @Get(':id')
    async get(
        @Param('id') id: string,
        @Query('companyId') companyId: string,
    ): Promise<JournalEntryResponseDto> {
        const entry = await this.getJournalEntry.execute(
            companyId,
            id,
        );

        if (!entry) {
            throw new NotFoundException(
                `Journal entry not found: ${id}`,
            );
        }

        return JournalEntryResponseDto.fromDomain(entry);
    }
}