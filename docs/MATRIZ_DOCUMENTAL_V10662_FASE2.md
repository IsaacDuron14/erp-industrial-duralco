# Fase 2 — Matriz de contratos documentales V106.62 → SQL

**Fecha:** 2026-11-08 · **Estado:** AUDITADO EN CÓDIGO / SIN MIGRACIÓN REAL.
**Regla:** No modificar V106.62, no crear nueva lógica de negocio, no mezclar bases externas. Estos son contratos de compatibilidad, **no** el SQL definitivo.

## 1. Contratos efectivos identificados en `index.html`

Los objetos a continuación son campos observados en snapshots o guardados reales; cada entidad también puede contener campos heredados por versiones anteriores o reparación histórica. **Conservar el JSON original completo** durante la importación, además de indexar campos necesarios. Las relaciones se aceptan solo tras conciliación.

| Entidad / clave de origen | Campos observados y relevantes | Vínculos y reglas |
|---|---|---|
| Cotizaciones — `cotiz-historial` | `numero,cliente,vendedor,metodoPago,fecha,fechaISO,validez,total,isv15,items[],html,guardadoEn`. Ítem: `detalle,cantidad,precio_unit,descuento,exento,origin,raw` | `numero` corresponde a documento comercial; `raw` preserva detalles técnicos de pernos, placas o tuercas; `origin` identifica módulo. Guardado `_guardarEnHistorialBlindado` cerca de línea 6831; snapshot línea 6425. |
| Presupuestos — `presup-historial` | `numero,proyecto,referencia,material[],manoObraEstimada,indirectosEstimados,requisicion,html,guardadoEn` más totales de `calcularTotalesPresupuesto()` | `referencia` vincula cotización. Bloquea emisión si hay materiales sin costo real; se guarda preservando metadatos históricos existentes. Guardado cerca de 10645–10687. |
| OT — `ot-historial` | `numero,proyecto,estado,fecha,fechaISO,itemsTotal,items[],cotizacionOrigen,html,cliente,responsable,area,fentrega,fentregaRaw,empleados[],observ,requisado,guardadoEn` | Relación directa por `cotizacionOrigen`, y rescate por presupuesto en título de proyecto; guardado cerca de 11736–11760, snapshot línea 11623. |
| Facturas — `fact-historial` | `numero,cliente,fecha,fechaISO,total,totalFactura,anticiposAplicados,saldoPendiente,isv15,html,formaPago,pagoConfirmado,cotizacionOrigen,cuenta,items[],pagoDetalle{},cobrado,guardadoEn` | **El total fiscal es el total íntegro de la factura**, los anticipos se mantienen aparte. Existen facturas históricas manuales con `agregadaManual,historicaMigracion,fueraFlujoOperativo`. Snapshot línea 9084; histórico manual línea 8725. |
| Recibos — `recibo-historial` | `numero,cotizacionOrigen,cliente,rtn,tipo,porcentaje,monto,totalCotizacion,saldoAnterior,saldoPendiente,cuenta,medio,medioLabel,referencia,medioDetalle,fecha,fechaISO,html,guardadoEn` | Un recibo anulado no se reactiva; `cuenta` determina creación de movimiento bancario en el primer guardado. Guardado línea 16505+, snapshot línea 16428. |
| Compras — `oc-historial` | `numero,proveedor,fecha,fechaISO,total,html,codClienteProveedor,rtnProveedor,direccionProveedor,usuarioSolicita,observaciones,condiciones,otNumero,formaPago,plazo,cuenta,items[],pagado,recibido,guardadoEn`. Ítem: `detalle,cantidad,precio_unit,tipoCatalogo,catalogKey,inventoryKey,noInventariable,exento` | `otNumero` es relación a OT; `inventoryKey` apunta al inventario físico cuando corresponde. Pagos no-crédito pueden crear salida bancaria. Snapshot línea 13788; guardado línea 14156+. |
| Entregas — `entrega-historial` | `numero,cliente,fecha,fechaISO,tipoOrigen,facturaOrigen,otOrigen,cotizacionOrigen,documentoOrigenTexto,items[],html,guardadoEn`; ítem: `detalle,cantidadEntregada` | El origen puede ser Factura u OT. Revalida cantidad pendiente antes de guardar; controles de concurrencia. Snapshot línea 16006 y guardado línea 16084+. |
| Cierre Real — `cierre-historial` | `proyecto,referencia,material,manoObra,variables,imprevistos,costoRealTotal,totalVendido,gananciaL,gananciaPct,materialPresupuestado,vendidoPresupuestado,guardadoEn` | Relacionado por referencia y proyecto; calcular ganancia como `totalVendido - costoRealTotal`. Guardado aprox. línea 11159. |
| Bancos — `bancos-movimientos` | `fecha,fechaISO,cuenta,tipo,categoria,monto,descripcion,origen,referencia,guardadoEn` | Entradas/salidas, referencia de origen y reversas. `registrarMovimientoBanco` previene duplicado `origen+referencia` (línea 15491), pero hay que conciliar movimientos existentes. |
| Requisiciones — `requisiciones-historial` e `inventario-requisiciones-v1` | `otNumero,proyecto,materiales[],fecha,fechaISO,confirmadoPor,requisicionMaestraId,operacionId,tipo`; maestro: `id,otNumero,proyecto,referencia,creadaEn,items[],estado,actualizadaEn` | `inventoryKey` enlaza artículos físicos, `otNumero` enlaza OT y `operacionId` evita doble entrega donde está presente. Líneas 16926, 17081, 17376. |
| Inventario físico — `inventario-maestro-v1` | Formato heterogéneo según versión; validar estructuras reales antes de fijar columnas | No poblar desde catálogo de costos. Las existencias son movimientos/cantidades físicas. |
| Kardex — `inventario-kardex-v1` | `id,fecha,tipo,inventoryKey,nombre,cantidadBase,unidadBase,origen,usuario`; variantes `deltaBase,direccion,operacionId,existenciaAnteriorBase,existenciaNuevaBase` | Entradas, salidas, devoluciones, ajustes y reversas. No derivar stock desde catálogo comercial. |

## 2. Relaciones: evidencia y grados de confianza

| Relación | Campo principal | Alternativa V106.62 | Política de migración |
|---|---|---|---|
| Presupuesto → Cotización | `presup.referencia` | Número histórico con / sin ceros | Resolver ID solo si coincide de forma unívoca; ambigüedad a excepciones. |
| OT → Cotización | `ot.cotizacionOrigen` | `presup.numero` dentro de `ot.proyecto`, o diagnóstico de vínculo | Identificar algoritmo efectivo V72: redefinición de `otPorCotizacion` cerca de línea 18950; preservar candidato y método. |
| Factura → Cotización | `fact.cotizacionOrigen` | Factura manual puede carecer de origen | No fabricar una relación para `fueraFlujoOperativo`. |
| Recibo → Cotización | `recibo.cotizacionOrigen` | Compatibilidad de ceros iniciales mediante `docEqV72` | Sumar solo recibos vigentes (excluyendo anulados/nulos). |
| Entrega → Factura/OT | `tipoOrigen + facturaOrigen/otOrigen` | `cotizacionOrigen` como referencia secundaria | Evitar una FK obligatoria a factura cuando origen es OT. |
| Compra → OT | `oc.otNumero` | Puede estar vacío | No inventar OT para compra independiente. |
| Requisición → OT | `otNumero` | Texto de referencia o historial previo | Conciliar requerido, entregado y devoluciones con Kardex. |
| Banco → Documento | `origen + referencia` | Reversas con clave compuesta textual | No deduplicar únicamente por monto/fecha. |

**Importante:** las asignaciones posteriores de funciones redefinen la lógica efectiva de vinculación, especialmente `presupuestoPorCotizacion` y `otPorCotizacion` (líneas 18945–18963). No reproducir simplemente las definiciones anteriores de la línea 9979.

## 3. Contrato de almacenamiento histórico (staging futuro)

Por cada fuente importada, preservar al menos:
- Identificador de lote + origen (Worker/KV, dispositivo local, respaldo explícito) + nombre de clave.
- Número original **texto**, fecha original y JSON sin modificar.
- Huella/hash del JSON y posición/índice dentro de la lista.
- Fecha de extracción y origen de extracción.
- Estado de resolución de referencias: `unica | ambigua | ausente | no_aplica`.
- Relación validada al UUID destino, **sin sobrescribir el campo original**.
- Registro de diferencias, excepciones y aprobación de conciliación.

No usar el índice del array como ID permanente. No convertir números históricos a integer cuando puedan perder ceros, ni asumir que todo registro tiene `numero` único.

## 4. Invariantes para probar antes de migrar datos reales

1. Vista previa no consume correlativo; solo se asigna en emisión/guardado.
2. Reemitir un documento existente actualiza el registro correcto, no duplica número.
3. Nunca reactivar recibos anulados.
4. El precio y total de un documento histórico deben permanecer inmutables frente a cambios de lista técnica.
5. Factura: el total fiscal original no se reduce por anticipos; saldo y anticipos se reflejan por separado.
6. Venta no-crédito: factura debe detectar ausencia de recibo válido al verificar cadena.
7. Banco: guardar recibo/OC dos veces no duplica asiento; una reversa no borra el movimiento original.
8. Kardex: una operación de entrega/reingreso no duplica existencias por repetición.
9. Conservación de los registros `nulo` y `anulada` para auditoría.
10. Las existencias del Inventario Maestro no se infieren de las referencias del catálogo técnico.
11. Entrega: no superar el saldo pendiente de artículos aun con dos operadores simultáneos.
12. Migración repetida del mismo lote no debe crear documentos duplicados.

## 5. Excepciones conocidas que requerirán decisión del usuario

- Dos documentos con distinto JSON pero mismo número comercial y tipo.
- Presupuesto asociado a varias cotizaciones o cotización sin presupuesto donde se esperaba.
- Factura manual/histórica sin cadena completa.
- Saldo/valor actual que no coincide con suma de movimientos originales.
- Respaldo cifrado sin frase de cifrado; no intentar eludirlo.
- Versiones de inventario/Kardex fuera del respaldo de 57 claves.

## 6. Puntos que NO están aprobados

- Crear tablas SQL definitivas o transformar numeraciones.
- Cargar datos productivos o consolidar respaldos de distintos dispositivos sin conciliación.
- Cambiar fórmula fiscal o margen, autorizar procesos nuevos, corregir datos originales.
- Desplegar una interfaz de módulos que no pase pruebas de equivalencia con V106.62.

**Siguiente entrega:** herramientas de auditoría de solo lectura, pruebas de muestra sintética y esquema lógico de relaciones (sin migración real).
