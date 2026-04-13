import { REQUIRED_TECHNICAL_COLUMNS } from "@/lib/constants/required-columns";

export function validateDatasetStructure(headers) {
  const missingColumns = REQUIRED_TECHNICAL_COLUMNS.filter((column) => !headers.includes(column));
  return { isValid: missingColumns.length === 0, missingColumns };
}
