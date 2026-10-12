import { JournalEntry } from '../../../domain/journal/journal-entry';
import { JournalEntryLine } from '../../../domain/journal/journal-entry-line';
import { JournalEntryStatus } from '../../../domain/journal/journal-entry-status';
import { Money } from '../../../domain/shared/money';
import { AccountMapper } from './account.mapper';
import { 
    AccountType as PrismaAccountType, 
    JournalEntryStatus as PrismaJournalEntryStatus 
} from '@prisma/client';

export class JournalEntryMapper {
    static toDomain(data: {
        id: string;
        companyId: string;
        date: Date;
        status: PrismaJournalEntryStatus;
        lines: {
            id: string;
            debit: unknown;
            credit: unknown;
            account: {
                id: string;
                companyId: string;
                name: string;
                type: PrismaAccountType;
            };
        }[];
    }): JournalEntry {
        const lines = data.lines.map((line) => {
            const account = AccountMapper.toDomain(line.account);

            const debit = Money.create(
                String(line.debit),
            );

            const credit = Money.create(
                String(line.credit),
            );

            if (!debit.isZero()) {
                return JournalEntryLine.debit(
                    account,
                    debit,
                );
            }

            return JournalEntryLine.credit(
                account,
                credit,
            );
        });

        return JournalEntry.reconstitute(
            data.id,
            data.companyId,
            data.date,
            lines,
            this.mapStatus(data.status),
        );
    }

    private static mapStatus(status: PrismaJournalEntryStatus): JournalEntryStatus {
        switch (status) {
            case PrismaJournalEntryStatus.DRAFT:
                return JournalEntryStatus.DRAFT;

            case PrismaJournalEntryStatus.POSTED:
                return JournalEntryStatus.POSTED;
        }
    }
}