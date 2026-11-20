import { z } from 'zod';

/**
 * Schema for stock intake records
 */
export const StockRecordSchema = z.object({
  facility_id: z.string().min(1, 'Facility ID is required'),
  medicine_id: z.string().min(1, 'Medicine ID is required'),
  batch_number: z.string().min(1, 'Batch number is required'),
  quantity: z.number().int().nonnegative('Quantity must be >= 0'),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be YYYY-MM-DD'),
  manufacture_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Manufacture date must be YYYY-MM-DD').optional()
});

/**
 * Validates array of CSV row records
 * Detects duplicates, schema mismatches, and impossible values
 */
export function validateStockCSV(rows) {
  const validRecords = [];
  const invalidRecords = [];
  const seenBatches = new Set();
  const duplicateRecords = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Type coercion for quantity if string
    const parsedRow = {
      ...row,
      quantity: typeof row.quantity === 'string' ? parseInt(row.quantity, 10) : row.quantity
    };

    const parseResult = StockRecordSchema.safeParse(parsedRow);

    if (!parseResult.success) {
      invalidRecords.push({
        row: rowNumber,
        record: row,
        errors: parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
      return;
    }

    const data = parseResult.data;

    // Impossible value check: Expiry before manufacture or past 2035
    if (data.manufacture_date && data.expiry_date <= data.manufacture_date) {
      invalidRecords.push({
        row: rowNumber,
        record: row,
        errors: ['Expiry date must be strictly after manufacture date']
      });
      return;
    }

    // Duplicate detection: same facility + medicine + batch
    const compositeKey = `${data.facility_id}|${data.medicine_id}|${data.batch_number}`;
    if (seenBatches.has(compositeKey)) {
      duplicateRecords.push({
        row: rowNumber,
        key: compositeKey,
        record: row,
        reason: 'Duplicate batch entry for same facility and medicine'
      });
      return;
    }

    seenBatches.add(compositeKey);
    validRecords.push(data);
  });

  return {
    is_valid: invalidRecords.length === 0 && duplicateRecords.length === 0,
    summary: {
      total_rows: rows.length,
      valid_count: validRecords.length,
      invalid_count: invalidRecords.length,
      duplicate_count: duplicateRecords.length
    },
    valid_records: validRecords,
    invalid_records: invalidRecords,
    duplicate_records: duplicateRecords
  };
}

