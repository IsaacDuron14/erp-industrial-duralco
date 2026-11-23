# Cotejo de orígenes de Informes vs módulos — V106.62

**Fuente inspeccionada:** `corebolthn_v106_62_CAPACITACION_FUNCIONAL(1).zip/index.html` (27,885 líneas).
**Modalidad:** auditoría estática. **No se inspeccionaron los registros de producción**. Ningún diagnóstico identifica una OT real como eliminada.

## Origen real de datos
La función `storageGet(key)` (líneas 3979-3999) primero consulta el servicio `/kv/<key>` si hay `syncUrl`; si falla, recurre a almacenamiento del navegador. `storageSet` (4000-4020) retorna `synced:false` cuando no pudo guardar en el servidor y conservó solo el dato local.

| Módulo/Informe | Origen compartido | Pantalla de Informe V106.62 | PDF general V106.62 |
|---|---|---|---|
| Cotizaciones | `cotiz-historial` / `historial` | `renderInformes`: no nulo, fecha ISO | `datosReporteInformes` |
| Facturación | `fact-historial` / `historialFactura` | Excluye nulo; sumatoria excluye anuladas | Incluye anuladas como detalle, con tratamiento posterior V106.29 |
| Recibos/anticipos | `recibo-historial` / `historialRecibos` | Excluye nulos y anulados | Igual en base |
| Ventas por vendedor | Cotizaciones y Facturas | Busca vendedor en cotización de origen | Recalcula, también depende de origen |
| Presupuestos | `presup-historial` | Excluye nulos, fecha `guardadoEn` | Igual, pero valores ausentes pueden romper `toFixed` |
| OT | `ot-historial` / `historialOT` | Excluye solo `nulo`, fecha `fechaISO` (13124-13127) | **Misma fuente** y filtro `!nulo` (12945-12946) |
| Cierres | `cierre-historial` | Excluye nulos, fecha `guardadoEn` | Igual, riesgo `gananciaPct.toFixed` |
| Entregas | `entrega-historial` | No existe sección base en `todasLasSecciones` | Falta sección |
| OC | `oc-historial` | Consulta propia, no sección del centro general | No está en `todasLasSecciones` |
| Inventario bajo mínimo | `config` + `getInvVarilla` | Estado actual, no histórico por período | Recalcula desde la misma fuente |

El centro general base `datosReporteInformes()` enumera ocho secciones en líneas 12984-13000: Cotizaciones, Facturas, Recibos, Ventas por vendedor, Presupuestos, Cierres, OT y Alertas de inventario. La impresión/PDF es creada desde `datosReporteInformes()` (13010-13026), mientras la pantalla usa `renderInformes()` (13043+).

## OT: diferencia verificada, hipótesis y diagnóstico
1. `loadOT()` recupera `ot-historial` (11322-11324); `saveHistorialOT()` persiste el mismo historial (11340).
2. El historial operativo `renderHistorialOT()` recorre `historialOT` y oculta los documentos con `nulo` (11967-11986). 
3. El informe de OT también lee `historialOT`, con criterio `!nulo` y fecha ISO (12945-12946, 13124-13127): **los dos coinciden en la fuente**, pero no están obligados a usar un único selector.
4. La eliminación original `eliminarHistorialOT()` (11960-11966) ejecuta `historialOT.splice(i,1)`, `await saveHistorialOT()` y repinta la pantalla **sin verificar `synced===true`**. Un fallo de sincronización puede dejar la eliminación solo local (4000-4020).
5. La recarga transversal `refrescarDatosCompartidos()` incluye `loadOT()` (6715-6721): cuando el servidor devuelve un historial previo, la OT puede reaparecer. Esto es una **hipótesis de explicación basada en código**, no evidencia de que ocurrió en producción.
6. `refrescarHistorialOT()` (6687-6692) llama `completarNulosAutomaticos()`, función que añade marcas NULO por números faltantes; eso podría producir renglones técnicos, pero **no recrea necesariamente una OT válida**. Investigar por número concreto antes de atribuirle el problema.
7. Un wrapper posterior V76 evita eliminar OT ya facturadas (19816-19821). Las rutas efectivas deben seguirse hasta la definición final; no replicar wrappers.
8. La prueba definitiva exige cotejar la OT en `ot-historial` servidor, navegador, informe, bitácora y posibles documentos dependientes. Registrar número **completo**, estado, fecha de guardado, actor, sincronización y dependencias. No borrar datos en el análisis.

## Anomalías adicionales demostrables
- Los informes generales no muestran Comprobantes de Entrega ni Órdenes de Compra, aunque existen historiales específicos.
- `renderInformes` tiene envoltorios V82/V85/V87/V106.29 (líneas 20924, 21203, 21342, 24430); la exportación tiene sobrescrituras. Evitar reutilizar estas capas en 2.0.
- Las facturas y recibos en `calcularIngresosRealesEnConjunto` (16237-16255) se combinan y limitan por total cotizado; esto **no equivale a efectivo efectivamente cobrado**.
- Las fechas de filtros difieren por familia (fechaISO vs guardadoEn); en SQL se debe normalizar el criterio y guardar ambas fechas.
- Historial OT incluye todos los estados operativos distintos de nulo, por lo que no es necesariamente sinónimo de OT en ejecución.

## Integración inicial para 2.0
Archivo `lib/corebolt/reportes/consulta-documental.ts`: función pura para seleccionar documentos por estado y período, resumir conteos y detectar diferencias de conjuntos por UUID. El historial y el informe deben invocar **la misma función y mismos filtros**, no desarrollar versiones independientes. Pruebas iniciales: `tests/consulta-documental.test.cjs`.

**Restricciones:** este módulo es un primer contrato compartido; aún NO lee SQL, NO está conectado a las pantallas de OT ni a PDFs, NO confirma paridad completa, NO arregla información histórica por sí solo. Sin datos operativos, no es posible enumerar OT discrepantes.

## Próximos controles de aceptación
- [ ] Integrar lectura SQL de OT por empresa/división con RLS y paginación, incluyendo estado y marca de anulación.
- [ ] Conectar pantalla OT + informe OT + PDF a una misma consulta de servicio con filtros.
- [ ] Proteger anulación mediante transacción y verificación de éxito, conservando auditoría.
- [ ] Impedir eliminación destructiva de OT con factura, recibo, inventario o requisiciones.
- [ ] Comparar números/documentos entre listado, detalle, informe, PDF y base; explicar exclusiones.
- [ ] Integrar las otras fuentes documentales con el mismo contrato, pruebas de fechas/estados y conciliación.
- [ ] Preparar control de anticipos de OT a partir de recibos aplicados, sin confundir anticipo registrado con dinero cobrado y sin bloquear retrospectivamente OT existentes.

**No se realizaron modificaciones a V106.62, SOE-HN o datos históricos.**
