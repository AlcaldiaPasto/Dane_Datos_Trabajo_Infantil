export function detectYearFromFileName(fileName) {
  const match = String(fileName || "").match(/(20\d{2})/);
  return match ? Number(match[1]) : null;
}

export function detectYearFromRows(headers, rows) {
  const yearColumns = headers.filter((header) => {
    const normalized = String(header || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    return ["anio", "ano", "year", "vigencia", "periodo"].some((candidate) =>
      normalized.includes(candidate)
    );
  });

  for (const column of yearColumns) {
    const detectedYears = new Set(
      rows
        .map((row) => String(row[column] || "").match(/20\d{2}/)?.[0])
        .filter(Boolean)
        .map(Number)
    );

    if (detectedYears.size === 1) {
      return [...detectedYears][0];
    }
  }

  return null;
}
