import { GeneralLedger } from "../get-general-ledger";

export class GeneralLedgerResponseDto {
    accountId: string;
    accountName: string;
    entries: {
        journalEntryId: string;
        date: string;
        debit: string;
        credit: string;
        balance: string;
    }[];

    static fromDomain(
        ledger: GeneralLedger,
    ): GeneralLedgerResponseDto {
        const dto = new GeneralLedgerResponseDto();

        dto.accountId = ledger.accountId;
        dto.accountName = ledger.accountName;
        dto.entries = ledger.entries.map(entry => ({
            journalEntryId: entry.journalEntryId,
            date: entry.date.toISOString(),
            debit: entry.debit.toString(),
            credit: entry.credit.toString(),
            balance: entry.balance.toString(),
        }));

        return dto;
    }
}