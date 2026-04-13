# App Trabajo Infantil

Aplicacion web en Next.js con JavaScript para cargar, validar, limpiar, comparar y visualizar archivos CSV del DANE relacionados con trabajo infantil.

## Stack

- Frontend: Next.js App Router con JavaScript
- Estilos: Tailwind CSS
- Graficas: Apache ECharts con `echarts-for-react`
- Backend: Route Handlers de Next.js en `src/app/api`
- CSV: `papaparse`
- Persistencia: sin base de datos; archivos temporales por sesion en `runtime/sessions`

## Rutas

- `/`: dashboard principal
- `/datasets`: listado administrativo de datasets cargados
- `/datasets/nuevo`: carga de nuevo CSV
- `/datasets/[datasetId]`: detalle del dataset
- `/comparacion`: comparacion anual
- `/procesos`: estado del procesamiento

## Estado actual implementado

- Proyecto Next.js con JavaScript y Tailwind CSS.
- Dataset base 2024 disponible por defecto en `src/data/base/2024/raw/dane-2024.csv`.
- Registro de metadatos base en `src/data/base/2024/metadata.json`.
- Navegacion lateral con accesos a dashboard, datasets, subir CSV, comparacion anual y procesos.
- El contexto de cada pagina se muestra en el menu lateral; no se usa encabezado superior global.
- `/datasets/nuevo` y `/procesos` usan contenedores centrados con ancho maximo.
- Pagina `/datasets/nuevo` para seleccionar CSV, ver nombre, tamano, ano detectado preliminar y subir/procesar.
- API `POST /api/datasets` para recibir CSV, parsear, validar estructura, detectar ano y guardar en `runtime/sessions`.
- Limpieza formal implementada para datasets validos:
  - conserva `raw.csv` sin alterar,
  - genera `cleaned.json`,
  - normaliza encabezados y valores vacios,
  - deriva `sexo`, `edad`, `estudia`, `trabaja`, `riesgoFinal`, `horasOficiosHogar`, `clasificacionCargaDomestica`, `trabajoEconomico`, `oficiosIntensivos` y `trabajoInfantilAmpliado`,
  - separa `previewBefore` y `previewAfter`.
- Gestion de datasets cargados en sesion:
  - evita duplicados por hash SHA-256 del contenido,
  - permite eliminar datasets cargados,
  - permite reprocesar datasets cargados usando la misma tuberia de limpieza,
  - mantiene el dataset base 2024 como no eliminable,
  - registra `processLog` por dataset.
- `/procesos` usa logs reales de datasets registrados y muestra progreso por dataset.
- El dataset base 2024 calcula vista limpia al leerse para el detalle y el dashboard.
- Listado `/datasets` con archivo, ano detectado, estado, filas, columnas, fecha de carga y acciones.
- Detalle `/datasets/[datasetId]` con columnas, reglas de limpieza, preview original, preview procesado y problemas.
- Dashboard con dos vistas internas:
  - Vista 1: KPI, filtros funcionales, situacion principal y carga domestica.
  - Vista 2: KPI, el mismo panel de filtros funcional, distribucion por edad, distribucion por sexo y tabla resumen.
  - El cambio entre vistas se controla desde el panel de filtros.
- Filtros funcionales en dashboard: ano, sexo, edad, trabaja, estudia y riesgo final.
- KPI y graficas recalculadas en cliente al cambiar filtros.
- Graficas con Apache ECharts como Client Components.
- Comparacion anual real en `/comparacion`:
  - usa solo datasets limpios,
  - permite seleccionar ano base y ano comparado,
  - usa 2024 como referencia si esta disponible,
  - calcula diferencia absoluta y porcentual,
  - muestra indicadores de subida, bajada o estabilidad,
  - expone los mismos datos en `GET /api/comparisons`.
- Exportacion implementada:
  - descarga CSV procesado por dataset desde `/api/datasets/[datasetId]/export?format=csv`,
  - descarga JSON procesado por dataset desde `/api/datasets/[datasetId]/export?format=json`,
  - descarga resumen JSON por dataset desde `/api/datasets/[datasetId]/export?format=summary`,
  - descarga resumen JSON del dashboard desde `/api/dashboard/export?format=json`,
  - descarga tabla resumen CSV del dashboard desde `/api/dashboard/export?format=csv`,
  - respeta filtros activos del dashboard cuando se usa desde el panel de filtros.

## Ejecutar

En PowerShell, usar `npm.cmd` si `npm.ps1` esta bloqueado por la politica de ejecucion.

```powershell
npm.cmd install
npm.cmd run dev
```

Abrir:

```txt
http://localhost:3000
```

## Validacion tecnica

Comandos usados para validar:

```powershell
npm.cmd run lint
npm.cmd run build
```

## Pendientes completos

1. Validacion CSV avanzada
   - Ampliar columnas obligatorias mas alla de `DIRECTORIO` y `ORDEN`.
   - Validar tipos numericos por columna.
   - Validar rangos esperados de codigos DANE.
   - Detectar separador automaticamente si llega CSV con `;`.
   - Reportar errores por fila y columna.

2. Dashboard avanzado
   - Agregar selector de vista o breadcrumbs para las dos vistas internas.
   - Agregar mas graficas por categoria si el diccionario DANE lo permite.
   - Ajustar responsivo para pantallas pequenas.
   - Agregar estados vacios cuando un filtro deje cero registros.
   - Sincronizar filtros con URL query params para compartir vistas.

3. Procesos
   - Agregar filtros o selector de dataset dentro de `/procesos` si la lista crece.
   - Mostrar errores de validacion en formato mas detallado por fila y columna.

4. Documentacion tecnica final
   - Documentar reglas de negocio DANE usadas.
   - Documentar columnas mapeadas.
   - Documentar calculo de trabajo economico.
   - Documentar calculo de oficios intensivos.
   - Documentar calculo de trabajo infantil ampliado.

5. Pruebas
   - Agregar pruebas unitarias para validacion y calculo de indicadores.
   - Agregar pruebas de API para carga de CSV.
   - Agregar pruebas manuales documentadas por pagina.

6. Pulido visual final
   - Revisar espaciados globales.
   - Homologar textos y acentos.
   - Ajustar colores finales.
   - Revisar accesibilidad basica en controles de filtros y botones.
