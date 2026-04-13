import { NextResponse } from "next/server";
import { reprocessDatasetById } from "@/lib/datasets/dataset-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, context) {
  const { datasetId } = await context.params;
  const result = await reprocessDatasetById(datasetId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, dataset: result.dataset, issues: result.issues || [] },
      { status: result.statusCode }
    );
  }

  return NextResponse.json({ ok: true, dataset: result.dataset, issues: result.issues || [] });
}
