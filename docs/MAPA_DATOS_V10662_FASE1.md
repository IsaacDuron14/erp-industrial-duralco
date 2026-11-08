# Auditoría de almacenamiento y relaciones — COREBOLT V106.62 → COREBOLT 2.0

**Estado:** primera inspección estática, sin ejecución ni importación de datos.
**Fuente:** copia local de `index.html` original V106.62 (27,885 líneas, ~1.8 MB).
**Alcance:** únicamente ERP COREBOLT. Este documento no propone funciones adicionales ni reemplaza una prueba E2E.

## Inventario verificable

- **27 vistas** encontradas mediante `div.view`: `pernos, placas, tuercas, cotiza, respaldo, capacitacion, agente, inventario, bancos, recibo, factura, entrega, presupuesto, ot, cierre, dashboard, informes, cliente360, cuentas, finanzas, ordencompra, operarios, asistencia, produccionot, costos, auditoria, accesos`.
- **57 claves** en la constante `BACKUP_KEYS`, cerca de línea 7248.
- **13 claves** marcadas `LOCAL_ONLY_BACKUP_KEYS`, cerca de línea 7259. Son principalmente borradores y listas de trabajo.
- **Almacenamiento en tres capas:** Worker/KV compartido (si está configurado), almacén `window.storage` (si existe) y `localStorage`. La capa compartida es prioritaria; el sistema puede caer a almacenamiento local si no hay conexión (aprox. líneas 3958–4020).
- Hay generación remota de números `/kv/{key}/next` para evitar colisiones, que debe sustituirse por asignación transaccional PostgreSQL (aprox. línea 4030).
- **No se copiaron claves de servicio, tokens o credenciales.** Cualquier credencial incrustada en código del cliente requiere rotación independiente de la migración.

## Grupos de datos declarados en BACKUP_KEYS (57)

| Área | Claves | Observación |
|---|---|---|
| Pernos | `bolt-config, bolt-params, bolt-list, bolt-materiales` | Configuración y borrador/lista activa |
| Placas | `placa-config, placa-params, placa-list, placa-espesores` | Configuración, espesores, borrador |
| Tuercas / productos | `tuerca-config, tuerca-params, tuerca-list` | Configuración, productos, borrador |
| Cotizaciones | `cotiz-fields, cotiz-overrides, cotiz-clientes, cotiz-vendedores, cotiz-metodos, cotiz-counter, cotiz-historial` | Clientes, condiciones, correlativo e historial |
| Inventario previo | `inv-varilla, inv-placas, inv-tuercas` | No confundir con Inventario Maestro |
| Facturación | `fact-sucursal, fact-fields, fact-overrides, fact-counter, fact-historial` | Datos fiscales y documentos históricos |
| Presupuestos | `presup-actual, presup-historial, presup-operarios, presup-tiempos, presup-asignacion, presup-herramientas` | Documentos y recursos |
| Cierre | `cierre-actual, cierre-historial` | Resultado de ejecución |
| OT | `ot-fields, ot-counter, ot-historial` | Orden de trabajo y correlativo |
| Compras | `oc-fields, oc-counter, oc-items, oc-historial, oc-proveedores` | OC, proveedores y borradores |
| Entrega | `entrega-fields, entrega-counter, entrega-historial` | Documentos de entrega |
| Recibo | `recibo-counter, recibo-historial, recibo-porcentajes` | Abonos y reglas |
| Requisiciones | `requisiciones-historial` | Historial vinculado a OT |
| Gestión | `auth-config, bitacora, gastos-operativos, bancos-cuentas, bancos-movimientos, personal-operarios-v1, produccion-registros-v1, produccion-config-v1` | Permisos, auditoría, bancos y producción |

## Hallazgo crítico: datos fuera de BACKUP_KEYS

Las llamadas directas a `storageGet/storageSet` incluyen claves adicionales **no incluidas en BACKUP_KEYS**:

- `inventario-maestro-v1` — artículos físicos en almacén.
- `inventario-kardex-v1` — movimientos de existencias.
- `inventario-requisiciones-v1` — requisiciones asociadas al inventario.
- `prod-divisiones` y `prod-categorias` — estructura de productos.
- `agente-chat`, `agente-api-url` y `app-version` — datos/configuración auxiliares.
- `inventario-precios-fusion-v89` aparece en guardados; debe verificarse su alcance y lectura.
  
**Implicación:** el JSON exportado desde la lista de respaldo no debe considerarse automáticamente un extracto íntegro de la operación. Primero hay que documentar todas las fuentes, inspeccionar su disponibilidad, y comparar sus conteos. No importar desde un solo navegador sin revisar el estado compartido y los locales.

## Cadena de dependencias documental

| Fuente | Referencia observada en V106.62 | Destino lógico | Evidencia |
|---|---|---|---|
| Cotización | `historial[].numero` | Presupuesto mediante `presup.referencia` | `presupuestoPorCotizacion` aprox. línea 9979 |
| Cotización | `numero` | OT mediante `ot.cotizacionOrigen`, o presupuesto vinculado | `otPorCotizacion` aprox. línea 9982 |
| Presupuesto | `historialPresupuesto[].numero` | OT mediante referencia/texto de proyecto | `obtenerPresupuestoLigadoAOT` aprox. línea 11765 |
| Cotización | `numero` | Factura mediante `factura.cotizacionOrigen` | reporte aprox. línea 16244 |
| Cotización | `numero` | Recibo mediante `recibo.cotizacionOrigen` | `sumaRecibosPorCotizacion` aprox. línea 16229 |
| Recibo | `numero, cuenta, monto` | Banco: movimiento de entrada | `guardarHistorialRecibo` aprox. línea 16530 |
| Orden de Compra | `numero, proveedor, total, cuenta` | Banco: salida para pago no-crédito | `guardarHistorialOC` aprox. línea 14175 |
| OT | `numero` | Requisición mediante `requisicion.otNumero` | aprox. líneas 11935 y 16895 |
| Requisición | `otNumero` y `inventoryKey` | Kardex: `SALIDA_OT` y devolución | aprox. líneas 17075 y 17766 |

**Advertencia:** hay lógica adicional posterior que redefine funciones de vinculación documental (p.ej. `presupuestoPorCotizacion`, `otPorCotizacion` cerca de línea 18947). Al reconstruir equivalencias hay que determinar las definiciones **efectivas al final del archivo**, no tomar la primera definición como comportamiento final.

## Reglas operativas críticas a reproducir

1. `diagnosticarCadenaFactura` (aprox. línea 10014) exige cotización válida con artículos, valores, presupuesto y OT. Para ventas no-crédito exige recibo vigente.
2. Los números comerciales pueden contener ceros a la izquierda. SQL debe guardarlos **como texto** más un UUID interno, sin perder presentación.
3. Preservar `nulo/anulada`, fechas, montos y snapshots históricos; no recalcular precios antiguos al actualizar catálogo.
4. El historial puede tener registros incompletos o restaurados manualmente. Separar **dato tal como existía** de **relación verificada** y llevar excepciones a conciliación.
5. Las claves del navegador marcadas locales son potencialmente diferentes entre dispositivos; requieren política de migración específica sin importar automáticamente borradores inconclusos.
6. La clave única de idempotencia de la futura importación debe incluir origen + tipo documental + clave original, con controles especiales para valores duplicados o vacíos.
7. En el SQL nuevo, usar transacciones para documento + correlativo + asiento de banco o Kardex, con reintentos seguros.

## Próximo entregable ANTES de crear SQL

- Levantar estructuras efectivas y campos de los historiales: cotizaciones, presupuestos, OT, facturas, recibos, entregas, compras, bancos, inventario y Kardex.
- Elaborar un diagrama de relaciones y una matriz de campos fuente→destino, incluyendo estados históricos y reglas de excepción.
- Preparar casos de prueba de equivalencia con valores ficticios sin transportar datos productivos.
- Una vez validados, definir migraciones SQL compatibles. **No ejecutar importación histórica ni modificar el ERP V106.62.**

## Corrección de estrategia

La pantalla personalizada `/catalogo` y la tabla SQL inventada `catalogo_insumos` se retiraron por decisión del usuario. Los módulos `pernos, placas, tuercas` son la fuente real del catálogo COREBOLT. Las tablas SQL preliminares no constituyen aún el esquema definitivo de la V106.62.
