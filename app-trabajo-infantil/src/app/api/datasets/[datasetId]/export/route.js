import { NextResponse } from "next/server";
import {
  buildCsvDownload,
  buildDatasetSummaryPayload,
  buildDownloadHeaders,
  buildJsonDownload,
  buildProcessedDatasetExport,
} from "@/lib/analytics/export-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, context) {
  const { datasetId } = await context.params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const result = await buildProcessedDatasetExport(datasetId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }

  const baseName = `${result.dataset.fileName || datasetId}-procesado`;

  if (format === "json") {
    return new NextResponse(
      buildJsonDownload({
        generatedAt: result.generatedAt,
        dataset: result.dataset,
        columns: result.columns,
        rows: result.rows,
      }),
      {
        headers: buildDownloadHeaders({
          fileName: `${baseName}.json`,
          contentType: "application/json; charset=utf-8",
        }),
      }
    );
  }

  if (format === "summary") {
    return new NextResponse(buildJsonDownload(buildDatasetSummaryPayload(result)), {
      headers: buildDownloadHeaders({
        fileName: `${baseName}-resumen.json`,
        contentType: "application/json; charset=utf-8",
      }),
    });
  }

  return new NextResponse(buildCsvDownload(result.columns, result.rows), {
    headers: buildDownloadHeaders({
      fileName: `${baseName}.csv`,
      contentType: "text/csv; charset=utf-8",
    }),
  });
}
