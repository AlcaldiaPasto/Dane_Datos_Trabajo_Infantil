import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { detectIndicatorCoverage } from "../src/lib/analytics/indicator-coverage.js";
import { cleanRows } from "../src/lib/csv/cleaner.js";
import { filterRowsForPasto } from "../src/lib/csv/pasto-filter.js";
import { detectCsvDelimiter, parseCsvText } from "../src/lib/csv/parser.js";
import { validateDatasetStructure } from "../src/lib/csv/validator.js";

test("detecta separador punto y coma en CSV del DANE", () => {
  const csv = "DIRECTORIO;ORDEN;P6040;P3271\n1;1;12;2";

  assert.equal(detectCsvDelimiter(csv), ";");
  assert.deepEqual(parseCsvText(csv).headers, ["DIRECTORIO", "ORDEN", "P6040", "P3271"]);
});

test("bloquea archivos sin columnas tecnicas obligatorias", () => {
  const validation = validateDatasetStructure(["P6040", "P3271"], [{ P6040: "12", P3271: "2" }]);

  assert.equal(validation.isValid, false);
  assert.deepEqual(validation.missingColumns, ["DIRECTORIO", "ORDEN"]);
});

test("reporta advertencias de rangos y catalogos sin bloquear estructura valida", () => {
  const validation = validateDatasetStructure(
    ["directorio", "orden", "p6040", "p3271"],
    [{ directorio: "1", orden: "1", p6040: "99", p3271: "8" }]
  );

  assert.equal(validation.isValid, true);
  assert.equal(validation.rowIssues.length, 2);
  assert.match(validation.warnings.join(" "), /P6040/);
  assert.match(validation.warnings.join(" "), /P3271/);
});

test("valida el dataset base 2024 sin advertencias falsas", () => {
  const csv = readFileSync("./src/data/base/2024/raw/dane-2024.csv", "utf8");
  const parsed = parseCsvText(csv);
  const validation = validateDatasetStructure(parsed.headers, parsed.rows);

  assert.equal(parsed.delimiter, ",");
  assert.equal(parsed.rows.length, 860);
  assert.equal(parsed.headers.length, 132);
  assert.equal(validation.isValid, true);
  assert.equal(validation.warnings.length, 0);
});

test("filtra registros de Pasto usando codigo AREA 52 del DANE", () => {
  const rows = [
    { DIRECTORIO: "1", AREA: "05", ORDEN: "1" },
    { DIRECTORIO: "2", AREA: "52", ORDEN: "2" },
    { DIRECTORIO: "3", AREA: "99", ORDEN: "3" },
  ];

  const result = filterRowsForPasto(rows, ["DIRECTORIO", "AREA", "ORDEN"]);

  assert.equal(result.summary.applied, true);
  assert.equal(result.summary.rule, "AREA = 52");
  assert.equal(result.summary.sourceRows, 3);
  assert.equal(result.summary.keptRows, 1);
  assert.deepEqual(result.rows, [{ DIRECTORIO: "2", AREA: "52", ORDEN: "2" }]);
});

test("filtra registros de Pasto por nombre de municipio cuando existe columna textual", () => {
  const rows = [
    { DIRECTORIO: "1", MUNICIPIO: "Pasto", ORDEN: "1" },
    { DIRECTORIO: "2", MUNICIPIO: "Tumaco", ORDEN: "2" },
    { DIRECTORIO: "3", MUNICIPIO: "SAN JUAN DE PASTO", ORDEN: "3" },
  ];

  const result = filterRowsForPasto(rows, ["DIRECTORIO", "MUNICIPIO", "ORDEN"]);

  assert.equal(result.summary.applied, true);
  assert.equal(result.summary.method, "municipality_name");
  assert.equal(result.summary.keptRows, 2);
  assert.equal(result.rows.every((row) => String(row.MUNICIPIO).toUpperCase().includes("PASTO")), true);
});

test("detecta cobertura parcial cuando existen columnas pero no hay datos para trabajo ampliado", () => {
  const headers = ["DIRECTORIO", "ORDEN", "AREA", "P400", "P3131S1", "P3131S1A1", "P3131S1A2"];
  const rows = [
    {
      DIRECTORIO: "1",
      ORDEN: "1",
      AREA: "52",
      P400: "3",
      P3131S1: "",
      P3131S1A1: "",
      P3131S1A2: "",
    },
  ];

  const coverage = detectIndicatorCoverage(headers, rows);

  assert.equal(coverage.economicWork, true);
  assert.equal(coverage.domesticHours, false);
  assert.equal(coverage.expandedChildLabor, false);
  assert.equal(coverage.riskFinal, false);
});

test("limpieza respeta filtro Pasto y mantiene nulo trabajo ampliado en cobertura parcial", () => {
  const headers = ["DIRECTORIO", "ORDEN", "AREA", "P400", "P3131S1", "P3131S1A1", "P3131S1A2"];
  const rows = [
    { DIRECTORIO: "1", ORDEN: "1", AREA: "52", P400: "1", P3131S1: "", P3131S1A1: "", P3131S1A2: "" },
    { DIRECTORIO: "2", ORDEN: "2", AREA: "11", P400: "1", P3131S1: "", P3131S1A1: "", P3131S1A2: "" },
  ];

  const filtered = filterRowsForPasto(rows, headers);
  const coverage = detectIndicatorCoverage(headers, filtered.rows);
  const cleaned = cleanRows(filtered.rows, {
    headers,
    dataset: { id: "qa", detectedYear: 2018, indicatorCoverage: coverage },
    indicatorCoverage: coverage,
  });

  assert.equal(filtered.rows.length, 1);
  assert.equal(cleaned.rows.length, 1);
  assert.equal(cleaned.rows[0].trabajoEconomico, true);
  assert.equal(cleaned.rows[0].oficiosIntensivos, null);
  assert.equal(cleaned.rows[0].trabajoInfantilAmpliado, null);
});
