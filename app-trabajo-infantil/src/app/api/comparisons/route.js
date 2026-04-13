import { NextResponse } from "next/server";
import { buildComparisonSnapshot } from "@/lib/analytics/comparison-service";
import { buildDashboardRecords } from "@/lib/analytics/dashboard-data-service";
import { listDatasets } from "@/lib/datasets/dataset-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const datasets = await listDatasets();
  const records = await buildDashboardRecords(datasets);
  const snapshot = buildComparisonSnapshot(datasets, records, {
    baseYear: searchParams.get("baseYear"),
    targetYear: searchParams.get("targetYear"),
  });

  return NextResponse.json({ snapshot });
}
