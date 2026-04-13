import { promises as fs } from "node:fs";
import { buildPreview, cleanRows } from "@/lib/csv/cleaner";
import { parseCsvText } from "@/lib/csv/parser";
import { getBaseDatasetCsvPath, getBaseDatasetMetadataPath, getSessionsRoot } from "@/lib/storage/file-store";

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content.replace(/^\uFEFF/, ""));
}

async function readCsvSnapshot(filePath, limit = 5) {
  const content = await fs.readFile(filePath, "utf8");
  const parsed = parseCsvText(content);
  const headers = parsed.headers;
  const rows = parsed.rows;

  return {
    headers: headers.slice(0, 8),
    rows: rows.slice(0, limit).map((row) =>
      Object.fromEntries(headers.slice(0, 8).map((header) => [header, row[header] || ""]))
    ),
    totalHeaders: headers,
    totalRows: rows.length,
    rawRows: rows,
  };
}

async function loadBaseDataset() {
  const metadata = await readJson(getBaseDatasetMetadataPath());
  const csvPath = getBaseDatasetCsvPath();
  const snapshot = await readCsvSnapshot(csvPath);
  const cleanResult = cleanRows(snapshot.rawRows, {
    headers: snapshot.totalHeaders,
    dataset: metadata,
  });

  return {
    ...metadata,
    rowCount: snapshot.totalRows,
    columnCount: snapshot.totalHeaders.length,
    columns: snapshot.totalHeaders,
    cleanedColumns: cleanResult.headers,
    previewBefore: { headers: snapshot.headers, rows: snapshot.rows },
    previewAfter: cleanResult.preview,
    cleaningRulesApplied: [...(metadata.cleaningRulesApplied || []), ...cleanResult.rules],
    rawPath: csvPath,
    cleanPath: null,
  };
}

async function hydrateSessionDataset(metadata) {
  if (!metadata.cleanPath) return metadata;

  try {
    const cleanContent = await fs.readFile(metadata.cleanPath, "utf8");
    const cleanDataset = JSON.parse(cleanContent.replace(/^\uFEFF/, ""));

    return {
      ...metadata,
      cleanedColumns: cleanDataset.columns || metadata.cleanedColumns || [],
      previewAfter: metadata.previewAfter || buildPreview(cleanDataset.columns || [], cleanDataset.rows || []),
    };
  } catch {
    return metadata;
  }
}

async function loadSessionDatasets() {
  const sessionsRoot = getSessionsRoot();
  try {
    const sessionFolders = await fs.readdir(sessionsRoot, { withFileTypes: true });
    const datasets = [];
    for (const sessionFolder of sessionFolders) {
      if (!sessionFolder.isDirectory()) continue;
      const sessionPath = `${sessionsRoot}/${sessionFolder.name}`;
      const childFolders = await fs.readdir(sessionPath, { withFileTypes: true });
      for (const childFolder of childFolders) {
        if (!childFolder.isDirectory()) continue;
        const metadataPath = `${sessionPath}/${childFolder.name}/metadata.json`;
        try {
          const metadata = await readJson(metadataPath);
          datasets.push(await hydrateSessionDataset(metadata));
        } catch {
          continue;
        }
      }
    }
    return datasets;
  } catch {
    return [];
  }
}

export async function listRegisteredDatasets() {
  const baseDataset = await loadBaseDataset();
  const sessionDatasets = await loadSessionDatasets();
  return [baseDataset, ...sessionDatasets];
}

export async function getRegisteredDatasetById(datasetId) {
  const datasets = await listRegisteredDatasets();
  return datasets.find((dataset) => dataset.id === datasetId) || null;
}
