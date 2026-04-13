import { PRIMARY_YEAR } from "@/lib/constants/year-rules";
import { formatNumber, formatPercent } from "@/lib/utils/numbers";

function uniqueSorted(values) {
  const years = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  return [...new Set(years)].sort((left, right) => left - right);
}

function toYear(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function summarizeYear(records, year) {
  const rows = records.filter((record) => Number(record.year) === Number(year));
  const totalChildren = rows.length;
  const economicWorkTotal = rows.filter((record) => record.economicWork).length;
  const intensiveChoresTotal = rows.filter((record) => record.intensiveChores).length;
  const expandedChildLaborTotal = rows.filter((record) => record.expandedChildLabor).length;

  return {
    year,
    totalChildren,
    economicWorkTotal,
    economicWorkPct: totalChildren ? economicWorkTotal / totalChildren : 0,
    intensiveChoresTotal,
    intensiveChoresPct: totalChildren ? intensiveChoresTotal / totalChildren : 0,
    expandedChildLaborTotal,
    expandedChildLaborPct: totalChildren ? expandedChildLaborTotal / totalChildren : 0,
  };
}

function getDirection(value) {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "stable";
}

function formatSignedNumber(value) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatNumber(value)}`;
}

function formatSignedPercent(value, digits = 2) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatPercent(value, digits)}`;
}

function buildCountMetric({ label, baseValue, targetValue, note }) {
  const absoluteDifference = targetValue - baseValue;
  const percentDifference = baseValue ? absoluteDifference / baseValue : targetValue ? 1 : 0;

  return {
    label,
    type: "count",
    baseValue,
    targetValue,
    baseLabel: formatNumber(baseValue),
    targetLabel: formatNumber(targetValue),
    differenceLabel: formatSignedNumber(absoluteDifference),
    percentDifferenceLabel: formatSignedPercent(percentDifference, 2),
    direction: getDirection(absoluteDifference),
    note,
  };
}

function buildPctMetric({ label, baseValue, targetValue, note }) {
  const pointDifference = targetValue - baseValue;
  const percentDifference = baseValue ? pointDifference / baseValue : targetValue ? 1 : 0;

  return {
    label,
    type: "percent",
    baseValue,
    targetValue,
    baseLabel: formatPercent(baseValue, 2),
    targetLabel: formatPercent(targetValue, 2),
    differenceLabel: `${pointDifference > 0 ? "+" : ""}${(pointDifference * 100).toFixed(2)} pp`,
    percentDifferenceLabel: formatSignedPercent(percentDifference, 2),
    direction: getDirection(pointDifference),
    note,
  };
}

function chooseYears(availableYears, params = {}) {
  const requestedBase = toYear(params.baseYear);
  const requestedTarget = toYear(params.targetYear);
  const baseYear = availableYears.includes(requestedBase)
    ? requestedBase
    : availableYears.includes(PRIMARY_YEAR)
      ? PRIMARY_YEAR
      : availableYears[0];
  const targetYear = availableYears.includes(requestedTarget) && requestedTarget !== baseYear
    ? requestedTarget
    : availableYears.find((year) => year !== baseYear);

  return { baseYear, targetYear };
}

export function buildComparisonSnapshot(datasets, records = [], params = {}) {
  const cleanDatasetYears = uniqueSorted(
    datasets.filter((dataset) => dataset.status === "clean").map((dataset) => dataset.detectedYear)
  );
  const availableYears = uniqueSorted(records.map((record) => record.year)).filter((year) => cleanDatasetYears.includes(year));

  if (availableYears.length < 2) {
    return {
      isReady: false,
      availableYears,
      message: "Solo hay un ano limpio disponible. No hay suficiente informacion para comparar incremento o disminucion entre anos.",
    };
  }

  const { baseYear, targetYear } = chooseYears(availableYears, params);
  const base = summarizeYear(records, baseYear);
  const target = summarizeYear(records, targetYear);
  const metrics = [
    buildCountMetric({
      label: "Total de menores",
      baseValue: base.totalChildren,
      targetValue: target.totalChildren,
      note: "Diferencia de registros disponibles por ano.",
    }),
    buildPctMetric({
      label: "Trabajo economico",
      baseValue: base.economicWorkPct,
      targetValue: target.economicWorkPct,
      note: "Porcentaje de menores con trabajo economico.",
    }),
    buildPctMetric({
      label: "Oficios intensivos",
      baseValue: base.intensiveChoresPct,
      targetValue: target.intensiveChoresPct,
      note: "Porcentaje con 15 horas o mas de oficios del hogar.",
    }),
    buildPctMetric({
      label: "Trabajo infantil ampliado",
      baseValue: base.expandedChildLaborPct,
      targetValue: target.expandedChildLaborPct,
      note: "Trabajo economico u oficios intensivos.",
    }),
  ];

  const chart = {
    categories: ["Trabajo economico", "Oficios intensivos", "Trabajo infantil ampliado"],
    baseYear,
    targetYear,
    baseValues: [base.economicWorkPct, base.intensiveChoresPct, base.expandedChildLaborPct].map((value) => Number((value * 100).toFixed(2))),
    targetValues: [target.economicWorkPct, target.intensiveChoresPct, target.expandedChildLaborPct].map((value) => Number((value * 100).toFixed(2))),
  };

  const expandedMetric = metrics.find((metric) => metric.label === "Trabajo infantil ampliado");
  const directionText = expandedMetric.direction === "up" ? "incremento" : expandedMetric.direction === "down" ? "disminucion" : "estabilidad";

  return {
    isReady: true,
    availableYears,
    baseYear,
    targetYear,
    base,
    target,
    metrics,
    chart,
    message: `Comparacion real entre ${baseYear} y ${targetYear}: el indicador de trabajo infantil ampliado muestra ${directionText} (${expandedMetric.differenceLabel}).`,
  };
}
