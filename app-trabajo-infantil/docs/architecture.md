# Arquitectura Tecnica

## Stack

- Next.js App Router con JavaScript.
- Tailwind CSS para estilos.
- Apache ECharts con `echarts-for-react` para visualizaciones.
- Parseo CSV con `papaparse` en cliente.
- Exportar/restaurar sesion local con `jszip` en cliente.
- Persistencia local con IndexedDB (`dexie`).
- Sin TypeScript, sin Python, sin Power BI y sin base de datos externa.

## Enfoque De Ejecucion

La aplicacion es **IndexedDB-first**:

- No usa filesystem del servidor para datasets del usuario.
- No depende de API Routes para guardar datasets, procesos o estado.
- Todo el ciclo (carga, validacion, limpieza, dashboard, comparacion, procesos, exportacion/restauracion) corre en navegador.

## Rutas

- `/`: dashboard principal con dataset 2024 por defecto, filtros KPI y graficas.
- `/datasets`: gestion administrativa de datasets en IndexedDB.
- `/datasets/nuevo`: carga y validacion inicial de CSV/ZIP en cliente.
- `/datasets/[datasetId]`: detalle, reglas, preview y problemas del dataset local.
- `/comparacion`: comparacion anual entre datasets limpios locales.
- `/procesos`: bitacora y estado de procesamiento local.
- `/sesion/restaurar`: restaurar sesion local desde ZIP.

## Persistencia Local (Dexie)

Base: `trabajoInfantilDB`

Stores:

- `datasets`
- `processes`
- `appState`

### Dataset base 2024

- Fuente: `public/data/base/2024/dane-2024.csv`
- Se siembra automaticamente en el primer arranque del navegador.
- Se guarda como `id = base-2024`, `sourceType = base`, `detectedYear = 2024`, `isPrimary = true`, `status = clean`.

## Dominio Cliente

La capa cliente aplica:

- deteccion de separador CSV
- parseo y normalizacion de columnas
- validacion estructural minima
- limpieza/derivacion de variables analiticas
- filtro territorial para Pasto
- deteccion de ano por columna o nombre de archivo
- calculo de KPI, resumenes, distribuciones y comparacion anual

## Exportar/Restaurar Sesion

Exportar y restaurar es local (sin backend):

- exporta `manifest.json` + dumps de stores (`datasets`, `processes`, `appState`) en ZIP
- restaura ZIP directamente a IndexedDB
- revalida y reasegura `base-2024` al finalizar

## Pruebas Recomendadas

```powershell
npm.cmd run lint
npm.cmd run build
```

Validar manualmente:

1. Cargar CSV/ZIP en `/datasets/nuevo`.
2. Confirmar dataset en `/datasets` tras recargar el navegador.
3. Revisar detalle en `/datasets/[datasetId]`.
4. Ver KPIs y filtros en `/`.
5. Comparar anos en `/comparacion`.
6. Ver bitacora en `/procesos`.
7. Exportar ZIP de sesion y restaurar en `/sesion/restaurar`.