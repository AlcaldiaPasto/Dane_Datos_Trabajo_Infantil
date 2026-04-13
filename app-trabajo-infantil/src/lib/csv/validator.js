import { REQUIRED_TECHNICAL_COLUMNS, SUGGESTED_ANALYTICAL_COLUMNS } from "@/lib/constants/required-columns";
import { normalizeColumnName } from "@/lib/csv/normalizer";

export function validateDatasetStructure(headers) {
  const normalizedHeaders = headers.map(normalizeColumnName);
  const missingColumns = REQUIRED_TECHNICAL_COLUMNS.filter((column) => !normalizedHeaders.includes(column));
  const missingSuggestedColumns = SUGGESTED_ANALYTICAL_COLUMNS.filter(
    (column) => !normalizedHeaders.includes(column)
  );

  return {
    isValid: missingColumns.length === 0,
    missingColumns,
    missingSuggestedColumns,
    normalizedHeaders,
  };
}
