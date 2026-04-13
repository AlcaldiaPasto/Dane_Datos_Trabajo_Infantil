import path from "node:path";

export function getProjectRoot() { return process.cwd(); }
export function getBaseDatasetCsvPath() { return path.join(getProjectRoot(), "src", "data", "base", "2024", "raw", "dane-2024.csv"); }
export function getBaseDatasetMetadataPath() { return path.join(getProjectRoot(), "src", "data", "base", "2024", "metadata.json"); }
export function getSessionsRoot() { return path.join(getProjectRoot(), "runtime", "sessions"); }
