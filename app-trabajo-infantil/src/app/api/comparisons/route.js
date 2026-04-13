import { NextResponse } from "next/server";
import { buildComparisonSnapshot } from "@/lib/analytics/comparison-service";
import { listDatasets } from "@/lib/datasets/dataset-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const datasets = await listDatasets();
  return NextResponse.json({ snapshot: buildComparisonSnapshot(datasets) });
}
