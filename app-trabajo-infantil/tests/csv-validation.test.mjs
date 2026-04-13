import test from "node:test";
import assert from "node:assert/strict";
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
