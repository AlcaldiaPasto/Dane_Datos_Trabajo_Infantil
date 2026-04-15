# App Trabajo Infantil (IndexedDB-first)

Aplicacion web en Next.js (JavaScript) para analisis de archivos CSV del DANE sobre trabajo infantil.

## Stack

- Next.js App Router (JavaScript)
- Tailwind CSS
- Apache ECharts + `echarts-for-react`
- Parseo CSV: `papaparse`
- ZIP local: `jszip`
- Persistencia cliente: `dexie` sobre IndexedDB

## Arquitectura actual

La aplicacion funciona con enfoque **client-side first**:

1. UI:
- paginas y componentes React
- dashboard, filtros, tablas y graficas

2. Dominio cliente:
- parseo CSV/ZIP
- validacion estructural
- limpieza y derivacion de campos
- deteccion de ano
- calculo de metricas
- comparacion anual

3. Persistencia cliente:
- base IndexedDB `trabajoInfantilDB`
- stores:
  - `datasets`
  - `processes`
  - `appState`

## Dataset base 2024

- Archivo fijo: `public/data/base/2024/dane-2024.csv`
- En el primer arranque del navegador:
  - se inicializa IndexedDB
  - si no existe `base-2024`, se procesa y guarda automaticamente

## Rutas

- `/` dashboard principal (datos locales)
- `/datasets` listado de datasets (IndexedDB)
- `/datasets/nuevo` carga CSV/ZIP y procesamiento local
- `/datasets/[datasetId]` detalle local con preview/reglas/issues
- `/comparacion` comparacion anual local entre anos limpios
- `/procesos` bitacora local de procesos
- `/sesion/restaurar` restaurar sesion local desde ZIP

## Flujo principal

1. Cargar CSV o ZIP en `/datasets/nuevo`
2. Procesar localmente (validar, filtrar Pasto, limpiar)
3. Guardar dataset y proceso en IndexedDB
4. Ver datasets en `/datasets`
5. Ver detalle en `/datasets/[datasetId]`
6. Analizar en dashboard y comparacion anual
7. Exportar sesion local a ZIP desde el menu lateral
8. Restaurar sesion local en `/sesion/restaurar`

## Exportar y restaurar sesion

La sesion se exporta/importa **sin backend**:

- Exportar:
  - `manifest.json`
  - `stores/datasets.json`
  - `stores/processes.json`
  - `stores/appState.json`

- Restaurar:
  - reemplaza datos locales actuales
  - vuelve a garantizar `base-2024` y `appState` global

## Comandos

```powershell
npm.cmd install
npm.cmd run dev
```

Validacion:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Estado

El flujo funcional principal esta migrado a IndexedDB y opera sin persistencia en servidor.

La app ya no requiere `src/app/api` para guardar datasets, procesos ni sesion del usuario.
