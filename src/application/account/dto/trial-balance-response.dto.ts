import { TrialBalance } from '../../../domain/ledger/trial-balance';

export class TrialBalanceResponseDto {
    companyId: string;
    rows: {
        accountId: string;
        accountName: string;
        debit: string;
        credit: string;
    }[];
    totalDebit: string;
    totalCredit: string;

    static fromDomain(
        companyId: string,
        trialBalance: TrialBalance,
    ): TrialBalanceResponseDto {
        const dto = new TrialBalanceResponseDto();

        dto.companyId = companyId;

        dto.rows = trialBalance.getRows().map(row => ({
            accountId: row.accountId,
            accountName: row.accountName,
            debit: row.debit.toString(),
            credit: row.credit.toString(),
        }));

        dto.totalDebit = trialBalance.getTotalDebit().toString();
        dto.totalCredit = trialBalance.getTotalCredit().toString();

        return dto;
    }
}