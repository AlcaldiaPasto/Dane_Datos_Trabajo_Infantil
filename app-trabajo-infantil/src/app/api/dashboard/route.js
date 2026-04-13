import { NextResponse } from "next/server";
import { buildDashboardSnapshot } from "@/lib/analytics/kpi-service";
import { listDatasets } from "@/lib/datasets/dataset-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const datasets = await listDatasets();
  const snapshot = await buildDashboardSnapshot(datasets);

  return NextResponse.json({ snapshot });
}
