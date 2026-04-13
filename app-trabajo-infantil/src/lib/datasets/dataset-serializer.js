import { UNKNOWN_YEAR_LABEL } from "@/lib/constants/year-rules";
import { formatDateTime } from "@/lib/utils/dates";

export function serializeDataset(dataset) {
  return { ...dataset, displayYear: dataset.detectedYear || UNKNOWN_YEAR_LABEL, uploadedAtLabel: formatDateTime(dataset.uploadedAt) };
}
