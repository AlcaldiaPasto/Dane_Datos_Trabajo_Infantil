"use client";

import Papa from "papaparse";
import Card from "@/components/ui/card";

const buttonClass =
  "inline-flex items-center justify-center rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-foreground transition hover:border-accent hover:bg-accent-soft hover:text-accent";

function normalizeBaseName(fileName) {
  const cleaned = String(fileName || "dataset")
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "dataset";
}

function downloadBlobFile(fileName, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildSummaryPayload(dataset) {
  return {
    id: dataset.id,
    fileName: dataset.fileName,
    detectedYear: dataset.detectedYear,
    status: dataset.status,
    rowCount: dataset.rowCount,
    columnCount: dataset.columnCount,
    uploadedAt: dataset.uploadedAt,
    updatedAt: dataset.updatedAt,
    indicatorCoverage: dataset.indicatorCoverage || null,
    summary: dataset.summary || null,
    issues: dataset.issues || [],
    cleaningRulesApplied: dataset.cleaningRulesApplied || [],
  };
}

export default function DatasetExportPanel({ dataset }) {
  const canExport = dataset.status === "clean";
  const isIndexedDbDataset = dataset.storageEngine === "indexeddb";
  const baseName = normalizeBaseName(dataset.fileName);

  function exportCsvLocal() {
    const rows = dataset.cleanedRows?.length ? dataset.cleanedRows : dataset.rawRows || [];
    const csv = Papa.unparse(rows);
    downloadBlobFile(`${baseName}-processed.csv`, "text/csv;charset=utf-8;", csv);
  }

  function exportJsonLocal() {
    const payload = {
      datasetId: dataset.id,
      fileName: dataset.fileName,
      detectedYear: dataset.detectedYear,
      rowCount: dataset.rowCount,
      columnCount: dataset.columnCount,
      columns: dataset.cleanedColumns?.length ? dataset.cleanedColumns : dataset.columns || [],
      rows: dataset.cleanedRows?.length ? dataset.cleanedRows : dataset.rawRows || [],
      generatedAt: new Date().toISOString(),
    };
    downloadBlobFile(`${baseName}-processed.json`, "application/json;charset=utf-8;", JSON.stringify(payload, null, 2));
  }

  function exportSummaryLocal() {
    const summaryPayload = buildSummaryPayload(dataset);
    downloadBlobFile(`${baseName}-summary.json`, "application/json;charset=utf-8;", JSON.stringify(summaryPayload, null, 2));
  }

  return (
    <Card
      title="Exportacion"
      subtitle="Descarga copias procesadas. El archivo original no se modifica."
      interactive
      className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]"
    >
      {canExport ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {isIndexedDbDataset ? (
            <>
              <button type="button" onClick={exportCsvLocal} className={buttonClass}>
                CSV procesado
              </button>
              <button type="button" onClick={exportJsonLocal} className={buttonClass}>
                JSON procesado
              </button>
              <button type="button" onClick={exportSummaryLocal} className={buttonClass}>
                Resumen JSON
              </button>
            </>
          ) : (
            <>
              <a href={`/api/datasets/${dataset.id}/export?format=csv`} className={buttonClass}>
                CSV procesado
              </a>
              <a href={`/api/datasets/${dataset.id}/export?format=json`} className={buttonClass}>
                JSON procesado
              </a>
              <a href={`/api/datasets/${dataset.id}/export?format=summary`} className={buttonClass}>
                Resumen JSON
              </a>
            </>
          )}
        </div>
      ) : (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Este dataset todavia no esta limpio. Corrige el procesamiento antes de exportarlo.
        </p>
      )}
    </Card>
  );
}

