import { NextResponse } from "next/server";
import {
  buildCsvDownload,
  buildDashboardExport,
  buildDownloadHeaders,
  buildJsonDownload,
} from "@/lib/analytics/export-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";
  const exportData = await buildDashboardExport(searchParams);

  if (format === "csv") {
    return new NextResponse(buildCsvDownload(["metric", "value", "support", "trend"], exportData.summaryRows), {
      headers: buildDownloadHeaders({
        fileName: `dashboard-resumen-${exportData.filters.year || "todos"}.csv`,
        contentType: "text/csv; charset=utf-8",
      }),
    });
  }

  return new NextResponse(buildJsonDownload(exportData), {
    headers: buildDownloadHeaders({
      fileName: `dashboard-resumen-${exportData.filters.year || "todos"}.json`,
      contentType: "application/json; charset=utf-8",
    }),
  });
}
