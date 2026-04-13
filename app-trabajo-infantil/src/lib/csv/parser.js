import Papa from "papaparse";

const DELIMITERS = [",", ";", "\t", "|"];

export function detectCsvDelimiter(text) {
  const firstLine = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .find((line) => line.trim());

  if (!firstLine) return ",";

  return DELIMITERS.map((delimiter) => ({
    delimiter,
    count: firstLine.split(delimiter).length,
  })).sort((left, right) => right.count - left.count)[0].delimiter;
}

export function parseCsvText(text) {
  const delimiter = detectCsvDelimiter(text);
  const parsed = Papa.parse(String(text || "").replace(/^\uFEFF/, ""), {
    delimiter,
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => String(header || "").trim(),
  });
  const headers = parsed.meta.fields || [];
  const rows = parsed.data.filter((row) =>
    Object.values(row).some((value) => String(value || "").trim() !== "")
  );

  return {
    delimiter,
    headers,
    rows,
    errors: parsed.errors || [],
  };
}
