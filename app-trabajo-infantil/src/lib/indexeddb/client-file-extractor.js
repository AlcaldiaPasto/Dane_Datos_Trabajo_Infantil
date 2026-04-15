import JSZip from "jszip";

function normalizeZipPath(fileName) {
  return String(fileName || "").replace(/\\/g, "/");
}

function isCsvPath(fileName) {
  return String(fileName || "").toLowerCase().endsWith(".csv");
}

function getZipCandidateScore(pathName) {
  const normalized = normalizeZipPath(pathName).toLowerCase();
  const depth = normalized.split("/").filter(Boolean).length;
  const hasCsvFolder = normalized.includes("/csv/") || normalized.startsWith("csv/");
  const folderPriority = hasCsvFolder ? 0 : 1;
  return { folderPriority, depth, length: normalized.length };
}

function selectBestCsvFromZip(entries) {
  return [...entries].sort((left, right) => {
    const a = getZipCandidateScore(left.name);
    const b = getZipCandidateScore(right.name);
    if (a.folderPriority !== b.folderPriority) return a.folderPriority - b.folderPriority;
    if (a.depth !== b.depth) return a.depth - b.depth;
    if (a.length !== b.length) return a.length - b.length;
    return left.name.localeCompare(right.name);
  })[0];
}

function isZipName(fileName) {
  return String(fileName || "").toLowerCase().endsWith(".zip");
}

function stripBom(text) {
  return String(text || "").replace(/^\uFEFF/, "");
}

export async function extractCsvInputFromFile(file) {
  if (!file) {
    throw new Error("No se selecciono ningun archivo.");
  }

  const lowerName = String(file.name || "").toLowerCase();
  if (lowerName.endsWith(".csv")) {
    return {
      csvText: stripBom(await file.text()),
      sourceCsvName: file.name || "dataset.csv",
      archiveInfo: null,
    };
  }

  if (!isZipName(file.name)) {
    throw new Error("El archivo debe ser .csv o .zip.");
  }

  const zipBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(zipBuffer);
  const csvEntries = Object.values(zip.files).filter((entry) => !entry.dir && isCsvPath(entry.name));

  if (!csvEntries.length) {
    throw new Error("El ZIP no contiene ningun archivo .csv.");
  }

  const selected = selectBestCsvFromZip(csvEntries);
  const csvText = stripBom(await selected.async("string"));

  return {
    csvText,
    sourceCsvName: normalizeZipPath(selected.name),
    archiveInfo: {
      isArchive: true,
      archiveName: file.name || "archivo.zip",
      sourceCsvName: normalizeZipPath(selected.name),
      csvCandidates: csvEntries.map((entry) => normalizeZipPath(entry.name)).slice(0, 30),
    },
  };
}

