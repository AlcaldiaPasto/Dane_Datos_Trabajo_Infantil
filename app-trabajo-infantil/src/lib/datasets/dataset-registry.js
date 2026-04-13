import { promises as fs } from "node:fs";
import { getBaseDatasetCsvPath, getBaseDatasetMetadataPath, getSessionsRoot } from "@/lib/storage/file-store";

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content.replace(/^\uFEFF/, ""));
}

async function readCsvSnapshot(filePath, limit = 5) {
  const content = await fs.readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter(Boolean);
  const headers = (lines[0] || "").split(",").map((value) => value.trim());
  const rows = lines.slice(1, limit + 1).map((line) => {
    const values = line.split(",");
    return headers.reduce((accumulator, header, index) => {
      accumulator[header] = values[index] || "";
      return accumulator;
    }, {});
  });
  return {
    headers: headers.slice(0, 8),
    rows: rows.map((row) => Object.fromEntries(headers.slice(0, 8).map((header) => [header, row[header] || ""]))),
    totalHeaders: headers,
    totalRows: Math.max(lines.length - 1, 0),
  };
}

async function loadBaseDataset() {
  const metadata = await readJson(getBaseDatasetMetadataPath());
  const csvPath = getBaseDatasetCsvPath();
  const snapshot = await readCsvSnapshot(csvPath);
  return {
    ...metadata,
    rowCount: snapshot.totalRows,
    columnCount: snapshot.totalHeaders.length,
    columns: snapshot.totalHeaders,
    previewBefore: { headers: snapshot.headers, rows: snapshot.rows },
    previewAfter: { headers: snapshot.headers, rows: snapshot.rows },
    rawPath: csvPath,
  };
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
          datasets.push(metadata);
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
