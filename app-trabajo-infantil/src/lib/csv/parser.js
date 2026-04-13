export function parseCsvText(text) {
  const lines = String(text || "").trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((value) => value.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",");
    return headers.reduce((accumulator, header, index) => {
      accumulator[header] = values[index] || "";
      return accumulator;
    }, {});
  });
  return { headers, rows };
}
