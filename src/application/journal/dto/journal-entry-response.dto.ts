import { JournalEntry } from '../../../domain/journal/journal-entry';

export class JournalEntryLineResponseDto {
    accountId: string;
    accountName: string;
    type: 'DEBIT' | 'CREDIT';
    amount: string;

    constructor(
        accountId: string,
        accountName: string,
        type: 'DEBIT' | 'CREDIT',
        amount: string,
    ) {
        this.accountId = accountId;
        this.accountName = accountName;
        this.type = type;
        this.amount = amount;
    }
}

export class JournalEntryResponseDto {
    id: string;
    status: string;
    lines: JournalEntryLineResponseDto[];

    constructor(
        id: string,
        status: string,
        lines: JournalEntryLineResponseDto[],
    ) {
        this.id = id;
        this.status = status;
        this.lines = lines;
    }

    static fromDomain(
        entry: JournalEntry,
    ): JournalEntryResponseDto {
        return new JournalEntryResponseDto(
            entry.getId(),
            entry.getStatus(),
            entry.getLines().map((line) => {
                const debit = line.getDebit();
                const credit = line.getCredit();

                if (!debit.isZero()) {
                    return new JournalEntryLineResponseDto(
                        line.getAccount().getId(),
                        line.getAccount().getName(),
                        'DEBIT',
                        debit.toString(),
                    );
                }

                return new JournalEntryLineResponseDto(
                    line.getAccount().getId(),
                    line.getAccount().getName(),
                    'CREDIT',
                    credit.toString(),
                );
            }),
        );
    }
}