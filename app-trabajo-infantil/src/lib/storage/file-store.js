import path from "node:path";

export function getProjectRoot() { return process.cwd(); }
export function getBaseDatasetCsvPath() { return path.join(getProjectRoot(), "src", "data", "base", "2024", "raw", "dane-2024.csv"); }
export function getBaseDatasetMetadataPath() { return path.join(getProjectRoot(), "src", "data", "base", "2024", "metadata.json"); }

function isVercelRuntime() {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true" || Boolean(process.env.VERCEL_URL);
}

export function getSessionsRoot() {
  if (isVercelRuntime()) {
    return path.join("/tmp", "app-trabajo-infantil", "sessions");
  }

  return path.join(getProjectRoot(), "runtime", "sessions");
}
