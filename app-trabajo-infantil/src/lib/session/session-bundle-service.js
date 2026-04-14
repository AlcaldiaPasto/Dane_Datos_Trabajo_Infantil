import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { getSessionsRoot } from "@/lib/storage/file-store";
import { getDefaultSessionId } from "@/lib/session/session-manager";

function getSessionDir(sessionId = getDefaultSessionId()) {
  return path.join(getSessionsRoot(), sessionId);
}

function isSafePathInside(baseDir, targetPath) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  return resolvedTarget === resolvedBase || resolvedTarget.startsWith(`${resolvedBase}${path.sep}`);
}

function normalizeZipEntry(entryName) {
  return String(entryName || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function collectFilesRecursively(baseDir, currentDir = baseDir, files = []) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      await collectFilesRecursively(baseDir, absolutePath, files);
      continue;
    }

    if (!entry.isFile()) continue;
    const relativePath = path.relative(baseDir, absolutePath);
    files.push({
      absolutePath,
      relativePath: toPosixPath(relativePath),
    });
  }

  return files;
}

function resolveRestoreRelativePath(entryName, sessionId) {
  const normalized = normalizeZipEntry(entryName);
  if (!normalized || normalized.endsWith("/")) return null;
  if (normalized === "manifest.json") return null;
  if (normalized.startsWith("__MACOSX/")) return null;
  if (normalized.split("/").some((segment) => segment === "..")) {
    throw new Error(`Entrada ZIP insegura detectada: ${entryName}`);
  }

  if (normalized.startsWith("data/")) {
    return normalized.slice("data/".length);
  }

  if (normalized.startsWith(`${sessionId}/`)) {
    return normalized.slice(`${sessionId}/`.length);
  }

  if (normalized.startsWith(`sessions/${sessionId}/`)) {
    return normalized.slice(`sessions/${sessionId}/`.length);
  }

  return normalized;
}

export async function buildSessionBundleZip() {
  const sessionId = getDefaultSessionId();
  const sessionDir = getSessionDir(sessionId);
  const zip = new JSZip();
  let files = [];

  try {
    await fs.access(sessionDir);
    files = await collectFilesRecursively(sessionDir);
  } catch {
    files = [];
  }

  for (const file of files) {
    const content = await fs.readFile(file.absolutePath);
    zip.file(`data/${file.relativePath}`, content);
  }

  const datasetIds = [...new Set(files.map((file) => file.relativePath.split("/")[0]).filter(Boolean))];
  const manifest = {
    format: "dane-session-bundle-v1",
    exportedAt: new Date().toISOString(),
    sessionId,
    totalFiles: files.length,
    totalDatasets: datasetIds.length,
    datasets: datasetIds,
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 9 } });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  return {
    zipBuffer,
    fileName: `sesion-procesada-${sessionId}-${stamp}.zip`,
    manifest,
  };
}

export async function restoreSessionBundleFromZip(bufferLike) {
  const sessionId = getDefaultSessionId();
  const sessionDir = getSessionDir(sessionId);
  const zip = await JSZip.loadAsync(bufferLike);
  const extractableEntries = [];

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const relativePath = resolveRestoreRelativePath(entry.name, sessionId);
    if (!relativePath) continue;
    extractableEntries.push({ entry, relativePath });
  }

  if (!extractableEntries.length) {
    throw new Error("El ZIP no contiene archivos de sesion restaurables.");
  }

  await fs.rm(sessionDir, { recursive: true, force: true });
  await fs.mkdir(sessionDir, { recursive: true });

  let restoredFiles = 0;
  let restoredDatasets = 0;

  for (const { entry, relativePath } of extractableEntries) {
    const targetPath = path.join(sessionDir, ...relativePath.split("/"));
    if (!isSafePathInside(sessionDir, targetPath)) {
      throw new Error(`Ruta insegura detectada durante restauracion: ${relativePath}`);
    }

    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    const content = await entry.async("nodebuffer");
    await fs.writeFile(targetPath, content);
    restoredFiles += 1;
    if (relativePath.endsWith("/metadata.json") || path.basename(relativePath) === "metadata.json") {
      restoredDatasets += 1;
    }
  }

  return {
    sessionId,
    restoredFiles,
    restoredDatasets,
  };
}

