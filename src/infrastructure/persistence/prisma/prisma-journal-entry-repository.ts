import { Injectable } from '@nestjs/common';

import { JournalEntry } from '../../../domain/journal/journal-entry';
import { JournalEntryRepository } from '../../../domain/journal/journal-entry-repository';

import { PrismaService } from '../../database/prisma.service';
import { PrismaTransactionContext } from '../../database/prisma-transaction-context';
import { JournalEntryMapper } from './journal-entry.mapper';

@Injectable()
export class PrismaJournalEntryRepository implements JournalEntryRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly txContext: PrismaTransactionContext,
    ) { }

    async findById(companyId: string, id: string): Promise<JournalEntry | null> {
        const data = await this.txContext.client(this.prisma).journalEntry.findFirst({
            where: {
                id,
                companyId,
            },
            include: {
                lines: {
                    include: {
                        account: true,
                    },
                },
            },
        });

        if (!data) {
            return null;
        }

        return JournalEntryMapper.toDomain(data);
    }

    async save(
        companyId: string,
        entry: JournalEntry,
    ): Promise<void> {
        // Reuses the unit of work's transaction when one is active.
        await this.txContext.transaction(this.prisma, async (tx) => {
            const existingEntry = await tx.journalEntry.findFirst({
                where: {
                    id: entry.getId(),
                    companyId,
                },
                select: {
                    id: true,
                },
            });

            if (!existingEntry) {
                await tx.journalEntry.create({
                    data: {
                        id: entry.getId(),
                        companyId,
                        date: entry.getDate(),
                        status: entry.getStatus(),

                        lines: {
                            create: entry.getLines().map((line) => ({
                                id: crypto.randomUUID(),
                                companyId,
                                accountId: line.getAccount().getId(),
                                debit: line.getDebit().toString(),
                                credit: line.getCredit().toString(),
                            })),
                        },
                    },
                });

                return;
            }

            await tx.journalEntry.update({
                where: {
                    id: entry.getId(),
                },
                data: {
                    status: entry.getStatus(),
                },
            });
        });
    }

    async findAll(
        companyId: string,
        fromDate?: Date,
        toDate?: Date,
    ): Promise<JournalEntry[]> {
        const entries = await this.txContext.client(this.prisma).journalEntry.findMany({
            where: {
                companyId,
                ...((fromDate || toDate) && {
                    date: {
                        ...(fromDate && { gte: fromDate }),
                        ...(toDate && { lte: toDate }),
                    },
                }),
            },
            include: {
                lines: {
                    include: {
                        account: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        })

        return entries.map(entry => JournalEntryMapper.toDomain(entry));
    }
}