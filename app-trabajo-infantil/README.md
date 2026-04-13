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
- Las paginas usan un area principal alineada al borde superior y ocupan todo el ancho disponible despues del menu lateral.
- El contenedor principal se estira hasta el final del alto disponible para evitar bloques cortos o desalineados.
- `/datasets/nuevo` y `/procesos` usan contenedores centrados con ancho maximo para evitar componentes estirados innecesariamente.
- Las tarjetas dentro de grids usan altura completa para evitar que una columna quede visualmente mas arriba o mas abajo que otra.
- Pagina `/datasets/nuevo` para seleccionar CSV, ver nombre, tamaño, año detectado preliminar y subir/procesar.
- API `POST /api/datasets` para recibir CSV, parsear, validar estructura, detectar año y guardar en `runtime/sessions`.
- Listado `/datasets` con archivo, año detectado, estado, filas, columnas, fecha de carga y detalle.
- En `/datasets`, se conservan el estado de sesion y el acceso de ingreso; el panel de datasets ocupa el espacio restante.
- Detalle `/datasets/[datasetId]` con columnas, reglas, preview y problemas.
- Dashboard con dos vistas internas:
  - Vista 1: KPI, filtros funcionales, situacion principal y carga domestica.
  - Vista 2: KPI, el mismo panel de filtros funcional, distribucion por edad, distribucion por sexo y tabla resumen.
  - El encabezado del dashboard se muestra como contexto en el menu lateral para evitar desplazamiento vertical.
  - El cambio entre vistas se controla desde el panel de filtros.
- Filtros funcionales en dashboard:
  - año
  - sexo
  - edad
  - trabaja
  - estudia
  - riesgo final
- KPI y graficas recalculadas en cliente al cambiar filtros.
- Graficas con Apache ECharts como Client Components.

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

2. Limpieza y procesamiento formal
   - Crear copia procesada `cleaned.json`.
   - Normalizar nombres de columnas.
   - Normalizar valores vacios.
   - Convertir tipos de datos.
   - Derivar campos analiticos persistidos: `sexo`, `edad`, `estudia`, `trabaja`, `riesgoFinal`, `domesticHours`.
   - Separar claramente preview original vs preview limpio.

3. Gestion completa de datasets
   - Implementar eliminacion real de datasets cargados en sesion.
   - Implementar reprocesamiento real.
   - Evitar duplicados si se sube el mismo archivo.
   - Mostrar logs de proceso por dataset.
   - Mantener el dataset base 2024 como no eliminable.

4. Comparacion anual real
   - Permitir seleccionar dos años disponibles.
   - Comparar 2024 contra otro año por defecto.
   - Calcular diferencia absoluta.
   - Calcular diferencia porcentual.
   - Mostrar flechas de incremento o disminucion por indicador.
   - Usar solo datasets `clean`.

5. Dashboard avanzado
   - Agregar selector de vista o breadcrumbs para las dos vistas internas.
   - Agregar mas graficas por categoria si el diccionario DANE lo permite.
   - Ajustar responsivo para pantallas pequeñas.
   - Agregar estados vacios cuando un filtro deje cero registros.
   - Sincronizar filtros con URL query params para compartir vistas.

6. Exportacion
   - Exportar dataset procesado a CSV.
   - Exportar resumen de indicadores a JSON.
   - Exportar tabla resumen del dashboard.

7. Procesos
   - Conectar `/procesos` con logs reales de carga, validacion y limpieza.
   - Mostrar progreso por dataset.
   - Mostrar errores de validacion en formato legible.

8. Documentacion tecnica final
   - Documentar reglas de negocio DANE usadas.
   - Documentar columnas mapeadas.
   - Documentar calculo de trabajo economico.
   - Documentar calculo de oficios intensivos.
   - Documentar calculo de trabajo infantil ampliado.

9. Pruebas
   - Agregar pruebas unitarias para validacion y calculo de indicadores.
   - Agregar pruebas de API para carga de CSV.
   - Agregar pruebas manuales documentadas por pagina.

10. Pulido visual final
   - Revisar espaciados globales.
   - Homologar textos y acentos.
   - Ajustar colores finales.
   - Revisar accesibilidad basica en controles de filtros y botones.
