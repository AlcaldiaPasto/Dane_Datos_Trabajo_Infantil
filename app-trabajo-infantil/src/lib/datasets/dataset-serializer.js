import { UNKNOWN_YEAR_LABEL } from "@/lib/constants/year-rules";
import { formatDateTime } from "@/lib/utils/dates";
import { withCoverageFallback } from "@/lib/analytics/indicator-coverage";

export function serializeDataset(dataset) {
  return {
    ...dataset,
    indicatorCoverage: withCoverageFallback(dataset),
    displayYear: dataset.detectedYear || UNKNOWN_YEAR_LABEL,
    uploadedAtLabel: formatDateTime(dataset.uploadedAt),
  };
}
