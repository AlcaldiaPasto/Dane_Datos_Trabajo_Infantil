import { NextResponse } from "next/server";
import { ingestCsvFile } from "@/lib/datasets/dataset-ingestion-service";
import { listDatasets } from "@/lib/datasets/dataset-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const datasets = await listDatasets();
  return NextResponse.json({ datasets });
}

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const result = await ingestCsvFile(file);

  if (!result.dataset) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }

  return NextResponse.json(
    {
      ok: result.ok,
      dataset: result.dataset,
      issues: result.issues,
    },
    { status: result.statusCode }
  );
}
