import { getDefaultFilters, buildDashboardSnapshotFromRecords } from "@/lib/analytics/dashboard-calculations";
import { buildDashboardRecords } from "@/lib/analytics/dashboard-data-service";

export async function buildDashboardSnapshot(datasets) {
  const records = await buildDashboardRecords(datasets);
  const filters = getDefaultFilters(records);

  return buildDashboardSnapshotFromRecords(records, filters);
}
