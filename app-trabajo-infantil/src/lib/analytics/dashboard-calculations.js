import { PRIMARY_YEAR } from "../constants/year-rules.js";
import { formatNumber, formatPercent } from "../utils/numbers.js";

export const ALL_FILTER_VALUE = "all";

export function getWeeklyDomesticHours(row) {
  let totalHours = 0;

  for (let question = 3131; question <= 3136; question += 1) {
    for (let section = 1; section <= 3; section += 1) {
      const baseKey = `P${question}S${section}`;
      const days = Number(row[`${baseKey}A1`] || 0);
      const hours = Number(row[`${baseKey}A2`] || 0);

      if (row[baseKey] === "1" && days > 0 && hours > 0) {
        totalHours += days * hours;
      }
    }
  }

  return totalHours;
}

export function getDomesticCategory(hours) {
  if (hours === 0) return "Sin oficios";
  if (hours <= 6) return "Apoyo domestico ligero";
  if (hours <= 14) return "Apoyo domestico moderado";
  return "Oficios intensivos";
}

export function isEconomicWork(row) {
  return row.P400 === "1" || row.P401 === "1" || row.P402 === "1" || row.P403 === "1";
}

export function isStudying(row) {
  return row.P6160 === "1" || row.P6170 === "1" || row.P400 === "3";
}

export function getSituation(studies, economicWork) {
  if (studies && economicWork) return "Estudia y trabaja";
  if (studies) return "Solo estudia";
  if (economicWork) return "Solo trabaja";
  return "No estudia";
}

export function deriveDashboardRecord(row, dataset, index = 0) {
  const economicWork = isEconomicWork(row);
  const studies = isStudying(row);
  const domesticHours = getWeeklyDomesticHours(row);
  const intensiveChores = domesticHours > 14;
  const expandedChildLabor = economicWork || intensiveChores;
  const age = Number(row.P6040 || 0) || null;

  return {
    id: `${dataset.id}-${row.DIRECTORIO || "row"}-${row.ORDEN || index}`,
    datasetId: dataset.id,
    year: dataset.detectedYear || null,
    sex: row.P3271 === "1" ? "Masculino" : row.P3271 === "2" ? "Femenino" : "No identificado",
    age,
    works: economicWork,
    studies,
    economicWork,
    intensiveChores,
    expandedChildLabor,
    domesticHours,
    domesticCategory: getDomesticCategory(domesticHours),
    situation: getSituation(studies, economicWork),
    riskFinal: expandedChildLabor ? "Trabajo infantil ampliado" : "Sin riesgo ampliado",
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
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function toOrderedItems(counts, orderedLabels) {
  return orderedLabels
    .map((label) => ({ label, value: counts[label] || 0 }))
    .filter((item) => item.value > 0 || orderedLabels.length <= 4);
}

function buildDelta(years) {
  return years.length > 1
    ? { direction: "up", title: "Comparacion anual disponible", message: "Hay mas de un anio limpio listo para comparar." }
    : {
        direction: "stable",
        title: "Comparacion anual no disponible",
        message: "Solo esta disponible el dataset 2024 limpio; aun no hay otro anio para comparar incremento o disminucion.",
      };
}

export function buildDashboardSnapshotFromRecords(records, filters) {
  const filteredRecords = applyDashboardFilters(records, filters);
  const totalChildren = filteredRecords.length;
  const economicWorkTotal = filteredRecords.filter((record) => record.economicWork).length;
  const intensiveChoresTotal = filteredRecords.filter((record) => record.intensiveChores).length;
  const expandedChildLaborTotal = filteredRecords.filter((record) => record.expandedChildLabor).length;
  const years = uniqueSorted(records.map((record) => record.year), (left, right) => left - right);
  const primaryYear = filters.year === ALL_FILTER_VALUE ? PRIMARY_YEAR : filters.year;

  const situationCounts = countBy(filteredRecords, (record) => record.situation);
  const domesticCounts = countBy(filteredRecords, (record) => record.domesticCategory);
  const ageCounts = countBy(filteredRecords, (record) => record.age || "Sin edad");
  const sexCounts = countBy(filteredRecords, (record) => record.sex);
  const comparisonState = buildDelta(years);

  return {
    primaryYear,
    filteredTotal: totalChildren,
    kpis: [
      {
        label: "Total de menores",
        value: formatNumber(totalChildren),
        note: "Registros despues de aplicar filtros.",
        delta: { direction: "stable", label: "Filtro activo", value: String(primaryYear) },
      },
      {
        label: "Pct Trabajo Economico",
        value: formatPercent(totalChildren ? economicWorkTotal / totalChildren : 0, 2),
        note: `${formatNumber(economicWorkTotal)} menores con trabajo economico.`,
        delta: { direction: "up", label: "Total", value: formatNumber(economicWorkTotal) },
      },
      {
        label: "Pct Oficios Intensivos",
        value: formatPercent(totalChildren ? intensiveChoresTotal / totalChildren : 0, 2),
        note: `${formatNumber(intensiveChoresTotal)} menores con 15 horas o mas.`,
        delta: { direction: "up", label: "Total", value: formatNumber(intensiveChoresTotal) },
      },
      {
        label: "Pct Trabajo Ampliado",
        value: formatPercent(totalChildren ? expandedChildLaborTotal / totalChildren : 0, 2),
        note: `${formatNumber(expandedChildLaborTotal)} menores en riesgo ampliado.`,
        delta: { direction: "up", label: "Total", value: formatNumber(expandedChildLaborTotal) },
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
        value: formatNumber(economicWorkTotal),
        support: formatPercent(totalChildren ? economicWorkTotal / totalChildren : 0, 2),
        trend: "Recalculado con filtros",
      },
      {
        metric: "Oficios intensivos",
        value: formatNumber(intensiveChoresTotal),
        support: formatPercent(totalChildren ? intensiveChoresTotal / totalChildren : 0, 2),
        trend: "15 horas o mas por semana",
      },
      {
        metric: "Trabajo infantil ampliado",
        value: formatNumber(expandedChildLaborTotal),
        support: formatPercent(totalChildren ? expandedChildLaborTotal / totalChildren : 0, 2),
        trend: "Trabajo economico u oficios intensivos",
      },
      {
        metric: "Sexo con mayor frecuencia",
        value:
          Object.entries(sexCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ||
          "Sin registros",
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
