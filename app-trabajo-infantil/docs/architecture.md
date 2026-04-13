# Arquitectura Tecnica

## Stack

- Next.js App Router con JavaScript.
- Tailwind CSS para estilos.
- Apache ECharts con `echarts-for-react` para visualizaciones.
- Backend con Route Handlers de Next.js en `src/app/api`.
- Procesamiento CSV con `papaparse`.
- Almacenamiento temporal en `runtime/sessions`.
- Sin TypeScript, sin Python, sin Power BI y sin base de datos persistente.

## Rutas

- `/`: dashboard principal con dataset 2024 por defecto, filtros, KPI y graficas.
- `/datasets`: gestion administrativa de datasets.
- `/datasets/nuevo`: carga y validacion inicial de CSV.
- `/datasets/[datasetId]`: detalle, reglas, previews, problemas y exportacion.
- `/comparacion`: comparacion anual entre datasets limpios.
- `/procesos`: bitacora y estado de procesamiento.

## Backend

Se usan Route Handlers de Next.js porque el proyecto es ligero, no requiere un servidor Express separado y mantiene frontend/backend en una sola unidad desplegable.

- `POST /api/datasets`: recibe CSV, valida, limpia y registra metadata.
- `GET /api/datasets`: lista datasets disponibles.
- `GET /api/datasets/[datasetId]`: entrega detalle del dataset.
- `DELETE /api/datasets/[datasetId]`: elimina datasets de sesion cargados por el usuario.
- `POST /api/datasets/[datasetId]/reprocess`: reprocesa datasets de sesion.
- `GET /api/datasets/[datasetId]/export`: exporta CSV/JSON/resumen.
- `GET /api/dashboard/export`: exporta resumen filtrado del dashboard.
- `GET /api/comparisons`: entrega comparacion anual real.
- `GET /api/processes`: entrega bitacoras de procesamiento.

## Manejo De Datasets

- El dataset base 2024 se lee desde `src/data/base/2024/raw/dane-2024.csv`.
- Los datasets cargados en sesion se guardan en `runtime/sessions/session-local/[datasetId]`.
- Cada dataset de sesion conserva `raw.csv` sin alterar.
- La limpieza genera `cleaned.json` con campos derivados.
- No se usa base de datos persistente.
- La deduplicacion usa hash SHA-256 del contenido del CSV.
- El dataset 2024 no se puede eliminar desde la aplicacion.

## Validacion CSV

- Se detecta automaticamente el separador entre `,`, `;`, tabulador y `|`.
- Las columnas tecnicas obligatorias actuales son `DIRECTORIO` y `ORDEN`.
- Las columnas analiticas sugeridas se reportan como advertencias cuando faltan.
- Se reportan encabezados duplicados.
- Se validan rangos y catalogos esperados para columnas como `P6040`, `P3271`, `P6160`, `P6170`, `P400`, `P401`, `P402` y `P403`.
- Las advertencias analiticas no bloquean la carga si la estructura tecnica minima existe.

## Limpieza Y Reglas De Negocio

- Se normalizan encabezados y valores vacios.
- `edad` sale de `P6040`.
- `sexo` sale de `P3271`.
- `estudia` se deriva de `P6160`, `P6170` y `P400`.
- `trabajoEconomico` se deriva de `P400`, `P401`, `P402` y `P403`.
- `horasOficiosHogar` se calcula con preguntas `P3131` a `P3136`.
- `oficiosIntensivos` se activa cuando las horas semanales de oficios del hogar superan 14.
- `trabajoInfantilAmpliado` se activa si existe trabajo economico u oficios intensivos.
- `riesgoFinal` clasifica entre `Trabajo infantil ampliado` y `Sin riesgo ampliado`.

## Comparacion Anual

- Solo compara datasets con estado `clean`.
- Usa 2024 como base si esta disponible.
- Permite seleccionar dos anios limpios disponibles.
- Calcula diferencia absoluta, cambio relativo y diferencia en puntos porcentuales.
- Muestra subida, bajada o estabilidad por indicador.

## Exportacion

- Dataset procesado en CSV.
- Dataset procesado en JSON.
- Resumen JSON por dataset.
- Resumen JSON del dashboard con filtros activos.
- Tabla resumen CSV del dashboard con filtros activos.

## Pruebas

Comandos:

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Pruebas actuales:

- Deteccion de separador CSV.
- Parseo de encabezados.
- Bloqueo por falta de columnas tecnicas obligatorias.
- Advertencias por rangos y catalogos fuera de lo esperado.
