import { NextResponse } from "next/server";
import { deleteDatasetById, getDatasetDetailById } from "@/lib/datasets/dataset-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, context) {
  const { datasetId } = await context.params;
  const dataset = await getDatasetDetailById(datasetId);
  if (!dataset) return NextResponse.json({ error: "Dataset no encontrado." }, { status: 404 });
  return NextResponse.json({ dataset });
}

export async function DELETE(request, context) {
  const { datasetId } = await context.params;
  const result = await deleteDatasetById(datasetId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.statusCode });
  return NextResponse.json({ ok: true });
}
