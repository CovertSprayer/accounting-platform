import { IsNotEmpty, IsString } from 'class-validator';

export class IssueInvoiceDto {
    @IsString()
    @IsNotEmpty()
    companyId: string;

    // Must be an ASSET account of the company. The caller is responsible for
    // choosing the Accounts Receivable account; the API cannot verify that yet.
    @IsString()
    @IsNotEmpty()
    receivableAccountId: string;

    @IsString()
    @IsNotEmpty()
    journalEntryId: string;
}
