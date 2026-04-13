export function formatNumber(value) {
  return new Intl.NumberFormat("es-CO").format(Number(value || 0));
}

export function formatPercent(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "N/D";
  }

  return new Intl.NumberFormat("es-CO", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value));
}
