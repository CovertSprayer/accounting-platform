import Decimal from 'decimal.js';

// Supported range for invoice values.
// Amounts are persisted as Decimal(20,4) (invoice lines and journal entry lines),
// which allows at most 16 integer digits. Checking here keeps out-of-range
// invoices from ever reaching the database, where they would fail with
// "numeric field overflow" in the middle of issuing.
export const MAX_QUANTITY = new Decimal('9999999999999999.9999');
export const MAX_UNIT_PRICE = new Decimal('9999999999999999.9999');

// Applies to rounded line amounts and the invoice total (which becomes the
// receivable debit in the journal entry).
export const MAX_MONEY_AMOUNT = new Decimal('9999999999999999.99');

export const MAX_DECIMAL_PLACES = 4;
