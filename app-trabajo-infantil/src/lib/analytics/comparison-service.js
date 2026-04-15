import { PRIMARY_YEAR } from "@/lib/constants/year-rules";
import { formatNumber, formatPercent } from "@/lib/utils/numbers";

const ALL_YEARS_VALUE = "all";

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

function summarizeBooleanMetric(rows, field) {
  const comparableRows = rows.filter((record) => typeof record[field] === "boolean");
  const positives = comparableRows.filter((record) => record[field]).length;

  return {
    available: comparableRows.length > 0,
    comparableRows: comparableRows.length,
    total: positives,
    ratio: comparableRows.length ? positives / comparableRows.length : null,
  };
}

function summarizeYear(records, year) {
  const rows = records.filter((record) => Number(record.year) === Number(year));
  const economic = summarizeBooleanMetric(rows, "economicWork");
  const intensive = summarizeBooleanMetric(rows, "intensiveChores");
  const expanded = summarizeBooleanMetric(rows, "expandedChildLabor");
  const ageAvailable = rows.some((record) => Number.isFinite(Number(record.age)));

  return {
    year,
    rows,
    totalChildren: rows.length,
    economicWorkTotal: economic.total,
    economicWorkPct: economic.ratio,
    economicWorkComparable: economic.available,
    intensiveChoresTotal: intensive.total,
    intensiveChoresPct: intensive.ratio,
    intensiveChoresComparable: intensive.available,
    expandedChildLaborTotal: expanded.total,
    expandedChildLaborPct: expanded.ratio,
    expandedChildLaborComparable: expanded.available,
    ageAvailable,
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

function buildChildLaborAgeChart(records, summaries, years) {
  const filtered = records.filter(
    (record) => years.includes(Number(record.year)) && record.expandedChildLabor === true
  );
  const detectedAges = uniqueSorted(
    filtered
      .map((record) => Number(record.age))
      .filter((age) => Number.isFinite(age) && age >= 5 && age <= 17)
  );
  const ageCategories = detectedAges.length
    ? detectedAges
    : Array.from({ length: 13 }, (_, index) => index + 5);
  const summaryByYear = summaries.reduce((accumulator, summary) => {
    accumulator[summary.year] = summary;
    return accumulator;
  }, {});

  const series = years.map((year) => {
    const summary = summaryByYear[year];
    const hasCoverage = Boolean(
      summary?.expandedChildLaborComparable &&
        summary?.ageAvailable &&
        Number(summary?.expandedChildLaborTotal || 0) > 0
    );
    const ageCountMap = filtered
      .filter((record) => Number(record.year) === Number(year))
      .reduce((accumulator, row) => {
        const age = Number(row.age);
        if (Number.isFinite(age) && age >= 5 && age <= 17) {
          accumulator[age] = (accumulator[age] || 0) + 1;
        }
        return accumulator;
      }, {});

    return {
      name: String(year),
      comparable: hasCoverage,
      data: hasCoverage ? ageCategories.map((age) => ageCountMap[age] || 0) : ageCategories.map(() => null),
    };
  });

  return {
    categories: ageCategories.map((age) => String(age)),
    series,
    hasComparableCoverage: series.filter((item) => item.comparable).length >= 2,
  };
}

function toPercentOrNull(value) {
  return value === null || value === undefined ? null : Number((value * 100).toFixed(2));
}

function buildIndicatorChart(seriesByYear) {
  return {
    categories: ["Trabajo economico", "Oficios intensivos", "Trabajo infantil ampliado"],
    series: seriesByYear.map((yearSummary) => ({
      name: String(yearSummary.year),
      data: [
        toPercentOrNull(yearSummary.economicWorkPct),
        toPercentOrNull(yearSummary.intensiveChoresPct),
        toPercentOrNull(yearSummary.expandedChildLaborPct),
      ],
    })),
  };
}

function buildIndicatorTrendCharts(seriesByYear) {
  const years = seriesByYear.map((item) => String(item.year));

  return {
    years,
    economicWork: seriesByYear.map((item) => toPercentOrNull(item.economicWorkPct)),
    intensiveChores: seriesByYear.map((item) => toPercentOrNull(item.intensiveChoresPct)),
    expandedChildLabor: seriesByYear.map((item) => toPercentOrNull(item.expandedChildLaborPct)),
  };
}

function buildCountMetric({ label, baseValue, targetValue, note }) {
  const absoluteDifference = targetValue - baseValue;
  const percentDifference = baseValue ? absoluteDifference / baseValue : targetValue ? 1 : 0;

  return {
    label,
    type: "count",
    isComparable: true,
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

function buildPctMetric({ label, baseValue, targetValue, baseAvailable, targetAvailable, note }) {
  if (!baseAvailable || !targetAvailable || baseValue === null || targetValue === null) {
    return {
      label,
      type: "percent",
      isComparable: false,
      baseValue,
      targetValue,
      baseLabel: baseAvailable && baseValue !== null ? formatPercent(baseValue, 2) : "N/D",
      targetLabel: targetAvailable && targetValue !== null ? formatPercent(targetValue, 2) : "N/D",
      differenceLabel: "N/D",
      percentDifferenceLabel: "N/D",
      direction: "stable",
      note: `${note} No comparable: faltan columnas en uno o ambos años.`,
    };
  }

  const pointDifference = targetValue - baseValue;
  const percentDifference = baseValue ? pointDifference / baseValue : targetValue ? 1 : 0;

  return {
    label,
    type: "percent",
    isComparable: true,
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
  const requestedTargetRaw = String(params.targetYear || "").trim().toLowerCase();
  const requestedTarget = toYear(params.targetYear);
  const baseYear = availableYears.includes(requestedBase)
    ? requestedBase
    : availableYears.includes(PRIMARY_YEAR)
      ? PRIMARY_YEAR
      : availableYears[0];

  if (requestedTargetRaw === ALL_YEARS_VALUE) {
    return {
      mode: "all",
      baseYear,
      targetYear: null,
      comparisonYears: availableYears,
    };
  }

  const targetYear = availableYears.includes(requestedTarget) && requestedTarget !== baseYear
    ? requestedTarget
    : availableYears.find((year) => year !== baseYear);

  return {
    mode: "pair",
    baseYear,
    targetYear,
    comparisonYears: [baseYear, targetYear].filter((value) => value !== null && value !== undefined),
  };
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
      message: "Solo hay un año limpio disponible. No hay suficiente informacion para comparar incremento o disminucion entre años.",
    };
  }

  const { mode, baseYear, targetYear, comparisonYears } = chooseYears(availableYears, params);
  const summaries = comparisonYears.map((year) => summarizeYear(records, year));
  const summaryByYear = summaries.reduce((accumulator, summary) => {
    accumulator[summary.year] = summary;
    return accumulator;
  }, {});
  const base = summaryByYear[baseYear];
  const target = mode === "pair"
    ? summaryByYear[targetYear]
    : summaryByYear[comparisonYears[comparisonYears.length - 1]];
  const metrics = [
    buildCountMetric({
      label: "Total de menores",
      baseValue: base.totalChildren,
      targetValue: target.totalChildren,
      note: "Diferencia de registros disponibles por año.",
    }),
    buildPctMetric({
      label: "Trabajo economico",
      baseValue: base.economicWorkPct,
      targetValue: target.economicWorkPct,
      baseAvailable: base.economicWorkComparable,
      targetAvailable: target.economicWorkComparable,
      note: "Porcentaje de menores con trabajo economico.",
    }),
    buildPctMetric({
      label: "Oficios intensivos",
      baseValue: base.intensiveChoresPct,
      targetValue: target.intensiveChoresPct,
      baseAvailable: base.intensiveChoresComparable,
      targetAvailable: target.intensiveChoresComparable,
      note: "Porcentaje con 15 horas o mas de oficios del hogar.",
    }),
    buildPctMetric({
      label: "Trabajo infantil ampliado",
      baseValue: base.expandedChildLaborPct,
      targetValue: target.expandedChildLaborPct,
      baseAvailable: base.expandedChildLaborComparable,
      targetAvailable: target.expandedChildLaborComparable,
      note: "Trabajo economico u oficios intensivos.",
    }),
  ];

  const chart = buildIndicatorChart(summaries);
  const childLaborAgeChart = buildChildLaborAgeChart(records, summaries, comparisonYears);
  const trendCharts = buildIndicatorTrendCharts(summaries);
  const comparableIndicators = metrics.filter((metric) => metric.type === "percent" && metric.isComparable).length;
  const unavailableIndicators = metrics
    .filter((metric) => metric.type === "percent" && !metric.isComparable)
    .map((metric) => metric.label);

  const expandedMetric = metrics.find((metric) => metric.label === "Trabajo infantil ampliado");
  const directionText = expandedMetric?.direction === "up" ? "incremento" : expandedMetric?.direction === "down" ? "disminucion" : "estabilidad";
  const pairMessageBase = expandedMetric?.isComparable
    ? `Comparacion real entre ${baseYear} y ${target.year}: el indicador de trabajo infantil ampliado muestra ${directionText} (${expandedMetric.differenceLabel}).`
    : `Comparacion entre ${baseYear} y ${target.year} con cobertura parcial. Revisa los indicadores marcados como N/D.`;
  const unavailableSuffix = unavailableIndicators.length
    ? ` Indicadores sin comparabilidad: ${unavailableIndicators.join(", ")}.`
    : "";
  const allYearsMessage = `Comparacion global de ${comparisonYears.length} años (${comparisonYears[0]}-${comparisonYears[comparisonYears.length - 1]}). Las graficas muestran todos los años limpios disponibles.${unavailableSuffix}`;

  return {
    isReady: true,
    mode,
    allYearsValue: ALL_YEARS_VALUE,
    availableYears,
    comparisonYears,
    baseYear,
    targetYear,
    base,
    target,
    metrics,
    chart,
    childLaborAgeChart,
    trendCharts,
    showTrendCharts: comparisonYears.length >= 3 && comparableIndicators > 0,
    hasComparableIndicators: comparableIndicators > 0,
    unavailableIndicators,
    message: mode === "all" ? allYearsMessage : `${pairMessageBase}${unavailableSuffix}`,
    badgeLabel: mode === "all" ? "Todos los años" : `${baseYear} vs ${targetYear}`,
  };
}
