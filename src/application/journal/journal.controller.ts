import {
    Body,
    Controller,
    Param,
    Post,
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

@Controller('journal-entries')
export class JournalController {
    constructor(
        private readonly createJournalEntry: CreateJournalEntry,
        private readonly postJournalEntry: PostJournalEntry,
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

        return new JournalEntryResponseDto(
            entry.getId(),
            entry.getStatus(),
        );
    }

    @Post(':id/post')
    async post(
        @Param('id') id: string,
        @Body('companyId') companyId: string,
    ): Promise<JournalEntryResponseDto> {
        const entry = await this.postJournalEntry.execute(companyId, id);
        
        return new JournalEntryResponseDto(
            entry.getId(),
            entry.getStatus(),
        );
    }
}