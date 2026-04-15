import { PRIMARY_YEAR } from "../constants/year-rules.js";
import { formatNumber, formatPercent } from "../utils/numbers.js";
import { withCoverageFallback } from "./indicator-coverage.js";

export const ALL_FILTER_VALUE = "all";

export function getWeeklyDomesticHours(row) {
  let totalHours = 0;
  let hasAnyDomesticData = false;

  for (let question = 3131; question <= 3136; question += 1) {
    for (let section = 1; section <= 3; section += 1) {
      const baseKey = `P${question}S${section}`;
      const baseValue = row[baseKey];
      const daysValue = row[`${baseKey}A1`];
      const hoursValue = row[`${baseKey}A2`];
      const days = Number(daysValue || 0);
      const hours = Number(hoursValue || 0);

      if (baseValue !== undefined && baseValue !== null && String(baseValue).trim() !== "") {
        hasAnyDomesticData = true;
      }
      if (daysValue !== undefined && daysValue !== null && String(daysValue).trim() !== "") {
        hasAnyDomesticData = true;
      }
      if (hoursValue !== undefined && hoursValue !== null && String(hoursValue).trim() !== "") {
        hasAnyDomesticData = true;
      }

      if (row[baseKey] === "1" && days > 0 && hours > 0) {
        totalHours += days * hours;
      }
    }
  }

  return hasAnyDomesticData ? totalHours : null;
}

export function getDomesticCategory(hours) {
  if (hours === null || hours === undefined || !Number.isFinite(Number(hours))) return null;
  if (hours === 0) return "Sin oficios";
  if (hours <= 6) return "Apoyo domestico ligero";
  if (hours <= 14) return "Apoyo domestico moderado";
  return "Oficios intensivos";
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function hasAnyValue(row, columns) {
  return columns.some((column) => hasValue(row[column]));
}

export function isEconomicWork(row) {
  if (!hasAnyValue(row, ["P400", "P401", "P402", "P403"])) return null;
  return row.P400 === "1" || row.P401 === "1" || row.P402 === "1" || row.P403 === "1";
}

export function isStudying(row) {
  if (!hasAnyValue(row, ["P6160", "P6170", "P400"])) return null;
  return row.P6160 === "1" || row.P6170 === "1" || row.P400 === "3";
}

export function getSituation(studies, economicWork) {
  if (studies && economicWork) return "Estudia y trabaja";
  if (studies) return "Solo estudia";
  if (economicWork) return "Solo trabaja";
  return "No estudia";
}

export function deriveDashboardRecord(row, dataset, index = 0) {
  const coverage = withCoverageFallback(dataset);
  const economicWork = coverage.economicWork ? isEconomicWork(row) : null;
  const studies = coverage.studies ? isStudying(row) : null;
  const domesticHours = coverage.domesticHours ? getWeeklyDomesticHours(row) : null;
  const intensiveChores = coverage.intensiveChores && domesticHours !== null ? domesticHours > 14 : null;
  const expandedChildLabor =
    coverage.expandedChildLabor && economicWork !== null && intensiveChores !== null
      ? Boolean(economicWork || intensiveChores)
      : null;
  const age = coverage.age ? Number(row.P6040 || 0) || null : null;

  return {
    id: `${dataset.id}-${row.DIRECTORIO || "row"}-${row.ORDEN || index}`,
    datasetId: dataset.id,
    year: dataset.detectedYear || null,
    sex: coverage.sex
      ? row.P3271 === "1"
        ? "Masculino"
        : row.P3271 === "2"
          ? "Femenino"
          : "No identificado"
      : null,
    age,
    works: economicWork,
    studies,
    economicWork,
    intensiveChores,
    expandedChildLabor,
    domesticHours,
    domesticCategory: coverage.domesticHours && domesticHours !== null ? getDomesticCategory(domesticHours) : null,
    situation: coverage.situation && studies !== null && economicWork !== null ? getSituation(studies, economicWork) : null,
    riskFinal: coverage.riskFinal
      ? expandedChildLabor === null
        ? null
        : expandedChildLabor
        ? "Trabajo infantil ampliado"
        : "Sin riesgo ampliado"
      : null,
  };
}

function uniqueSorted(values, sorter = undefined) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ""))].sort(
    sorter
  );
}

export function getDefaultFilters(records) {
  const years = uniqueSorted(records.map((record) => record.year), (left, right) => left - right);
  const defaultYear = years.includes(PRIMARY_YEAR) ? PRIMARY_YEAR : years[0] || PRIMARY_YEAR;

  return {
    year: String(defaultYear),
    sex: ALL_FILTER_VALUE,
    age: ALL_FILTER_VALUE,
    works: ALL_FILTER_VALUE,
    studies: ALL_FILTER_VALUE,
    riskFinal: ALL_FILTER_VALUE,
  };
}

export function buildFilterOptions(records) {
  return {
    years: uniqueSorted(records.map((record) => record.year), (left, right) => left - right).map(
      (year) => ({ value: String(year), label: String(year) })
    ),
    sex: uniqueSorted(records.map((record) => record.sex)).map((sex) => ({
      value: sex,
      label: sex,
    })),
    ages: uniqueSorted(records.map((record) => record.age), (left, right) => left - right).map(
      (age) => ({ value: String(age), label: String(age) })
    ),
    works: [
      { value: "yes", label: "Trabaja" },
      { value: "no", label: "No trabaja" },
    ],
    studies: [
      { value: "yes", label: "Estudia" },
      { value: "no", label: "No estudia" },
    ],
    riskFinal: uniqueSorted(records.map((record) => record.riskFinal)).map((risk) => ({
      value: risk,
      label: risk,
    })),
  };
}

export function applyDashboardFilters(records, filters) {
  return records.filter((record) => {
    if (filters.year !== ALL_FILTER_VALUE && String(record.year) !== String(filters.year)) return false;
    if (filters.sex !== ALL_FILTER_VALUE && record.sex !== filters.sex) return false;
    if (filters.age !== ALL_FILTER_VALUE && String(record.age) !== String(filters.age)) return false;
    if (filters.works !== ALL_FILTER_VALUE && record.works !== (filters.works === "yes")) return false;
    if (filters.studies !== ALL_FILTER_VALUE && record.studies !== (filters.studies === "yes")) return false;
    if (filters.riskFinal !== ALL_FILTER_VALUE && record.riskFinal !== filters.riskFinal) return false;
    return true;
  });
}

function countBy(records, getKey) {
  return records.reduce((accumulator, record) => {
    const key = getKey(record);
    if (key === null || key === undefined || key === "") return accumulator;
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function toOrderedItems(counts, orderedLabels) {
  return orderedLabels.map((label) => ({ label, value: counts[label] || 0 })).filter((item) => item.value > 0);
}

function buildDelta(years) {
  return years.length > 1
    ? { direction: "up", title: "Comparacion anual disponible", message: "Hay mas de un año limpio listo para comparar." }
    : {
        direction: "stable",
        title: "Comparacion anual no disponible",
        message: "Solo esta disponible el dataset 2024 limpio; aun no hay otro año para comparar incremento o disminucion.",
      };
}

function buildBooleanMetric(records, field) {
  const validRows = records.filter((record) => typeof record[field] === "boolean");
  const positiveRows = validRows.filter((record) => record[field]);

  return {
    available: validRows.length > 0,
    denominator: validRows.length,
    total: positiveRows.length,
    ratio: validRows.length ? positiveRows.length / validRows.length : null,
  };
}

function formatKpiPercentValue(metric) {
  return metric.available && metric.ratio !== null ? formatPercent(metric.ratio, 2) : "N/D";
}

function formatKpiMetricNote(metric, availableMessage, missingMessage) {
  if (!metric.available) {
    return missingMessage;
  }

  return availableMessage(metric.total);
}

function buildSummaryMetric(metric, unavailableTrend, availableTrend) {
  if (!metric.available) {
    return {
      value: "N/D",
      support: "No comparable",
      trend: unavailableTrend,
    };
  }

  return {
    value: formatNumber(metric.total),
    support: formatPercent(metric.ratio || 0, 2),
    trend: availableTrend,
  };
}

export function buildDashboardSnapshotFromRecords(records, filters) {
  const filteredRecords = applyDashboardFilters(records, filters);
  const totalChildren = filteredRecords.length;
  const economicWorkMetric = buildBooleanMetric(filteredRecords, "economicWork");
  const intensiveChoresMetric = buildBooleanMetric(filteredRecords, "intensiveChores");
  const expandedChildLaborMetric = buildBooleanMetric(filteredRecords, "expandedChildLabor");
  const years = uniqueSorted(records.map((record) => record.year), (left, right) => left - right);
  const primaryYear = filters.year === ALL_FILTER_VALUE ? PRIMARY_YEAR : filters.year;

  const situationCounts = countBy(
    filteredRecords.filter((record) => typeof record.situation === "string"),
    (record) => record.situation
  );
  const domesticCounts = countBy(
    filteredRecords.filter((record) => typeof record.domesticCategory === "string"),
    (record) => record.domesticCategory
  );
  const ageCounts = countBy(
    filteredRecords.filter((record) => Number.isFinite(Number(record.age))),
    (record) => Number(record.age)
  );
  const sexCounts = countBy(
    filteredRecords.filter((record) => typeof record.sex === "string"),
    (record) => record.sex
  );
  const comparisonState = buildDelta(years);

  const economicSummary = buildSummaryMetric(
    economicWorkMetric,
    "No disponible para este dataset por ausencia de columnas de trabajo economico.",
    "Recalculado con filtros"
  );
  const intensiveSummary = buildSummaryMetric(
    intensiveChoresMetric,
    "No disponible para este dataset por ausencia de columnas de oficios del hogar.",
    "15 horas o mas por semana"
  );
  const expandedSummary = buildSummaryMetric(
    expandedChildLaborMetric,
    "No disponible para este dataset por cobertura parcial de trabajo ampliado.",
    "Trabajo economico u oficios intensivos"
  );

  return {
    primaryYear,
    filteredTotal: totalChildren,
    dataCoverage: {
      economicWork: economicWorkMetric.available,
      intensiveChores: intensiveChoresMetric.available,
      expandedChildLabor: expandedChildLaborMetric.available,
      situation: Object.keys(situationCounts).length > 0,
      domesticDistribution: Object.keys(domesticCounts).length > 0,
      ageDistribution: Object.keys(ageCounts).length > 0,
      sexDistribution: Object.keys(sexCounts).length > 0,
    },
    kpis: [
      {
        label: "Total de menores",
        value: formatNumber(totalChildren),
        note: "Registros despues de aplicar filtros.",
        delta: { direction: "stable", label: "Filtro activo", value: String(primaryYear) },
      },
      {
        label: "Pct Trabajo Economico",
        value: formatKpiPercentValue(economicWorkMetric),
        note: formatKpiMetricNote(
          economicWorkMetric,
          (total) => `${formatNumber(total)} menores con trabajo economico.`,
          "No disponible: faltan columnas para trabajo economico."
        ),
        delta: {
          direction: economicWorkMetric.available ? "up" : "stable",
          label: "Total",
          value: economicWorkMetric.available ? formatNumber(economicWorkMetric.total) : "N/D",
        },
      },
      {
        label: "Pct Oficios Intensivos",
        value: formatKpiPercentValue(intensiveChoresMetric),
        note: formatKpiMetricNote(
          intensiveChoresMetric,
          (total) => `${formatNumber(total)} menores con 15 horas o mas.`,
          "No disponible: faltan columnas de oficios del hogar."
        ),
        delta: {
          direction: intensiveChoresMetric.available ? "up" : "stable",
          label: "Total",
          value: intensiveChoresMetric.available ? formatNumber(intensiveChoresMetric.total) : "N/D",
        },
      },
      {
        label: "Pct Trabajo Ampliado",
        value: formatKpiPercentValue(expandedChildLaborMetric),
        note: formatKpiMetricNote(
          expandedChildLaborMetric,
          (total) => `${formatNumber(total)} menores en riesgo ampliado.`,
          "No disponible: el dataset no permite calcular trabajo ampliado."
        ),
        delta: {
          direction: expandedChildLaborMetric.available ? "up" : "stable",
          label: "Total",
          value: expandedChildLaborMetric.available ? formatNumber(expandedChildLaborMetric.total) : "N/D",
        },
      },
    ],
    situationChart: {
      categories: ["Solo estudia", "No estudia", "Estudia y trabaja", "Solo trabaja"],
      values: ["Solo estudia", "No estudia", "Estudia y trabaja", "Solo trabaja"].map(
        (label) => situationCounts[label] || 0
      ),
    },
    domesticDonut: toOrderedItems(domesticCounts, [
      "Sin oficios",
      "Apoyo domestico ligero",
      "Apoyo domestico moderado",
      "Oficios intensivos",
    ]),
    ageChart: {
      categories: Object.keys(ageCounts).sort((left, right) => Number(left) - Number(right)),
      values: Object.keys(ageCounts)
        .sort((left, right) => Number(left) - Number(right))
        .map((age) => ageCounts[age]),
    },
    sexDonut: toOrderedItems(sexCounts, ["Femenino", "Masculino", "No identificado"]),
    summaryRows: [
      {
        metric: "Trabajo economico",
        value: economicSummary.value,
        support: economicSummary.support,
        trend: economicSummary.trend,
      },
      {
        metric: "Oficios intensivos",
        value: intensiveSummary.value,
        support: intensiveSummary.support,
        trend: intensiveSummary.trend,
      },
      {
        metric: "Trabajo infantil ampliado",
        value: expandedSummary.value,
        support: expandedSummary.support,
        trend: expandedSummary.trend,
      },
      {
        metric: "Sexo con mayor frecuencia",
        value:
          Object.entries(sexCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ||
          "No disponible",
        support: formatNumber(Object.entries(sexCounts).sort((left, right) => right[1] - left[1])[0]?.[1] || 0),
        trend: "Segun filtro activo",
      },
    ],
    annualComparison: {
      isVisible: years.length > 1,
      direction: comparisonState.direction,
      title: comparisonState.title,
      message: comparisonState.message,
    },
  };
}
