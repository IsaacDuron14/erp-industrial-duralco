# COREBOLT 2.0 — Auditoría de integridad documental e informes

**Origen:** Informe técnico suministrado por el usuario sobre ERP COREBOLT funcional V106.62.
**Modalidad:** Revisión estática del código fuente. **Estado:** integridad parcialmente verificada; no se han conciliado registros productivos reales.
**Destino:** proyecto `IsaacDuron14/erp-industrial-duralco`, rama `desarrollo/integracion-modulos`.

## Objetivo y alcance
Migrar completamente los módulos sin reproducir los problemas de historiales, vínculos, cálculos, reportes ni exportaciones. La reconstrucción SQL en el repositorio nuevo es compatible con la recomendación de **no reconstruir ni alterar la aplicación antigua en producción**. No migrar datos históricos hasta que el ERP nuevo esté integrado y validado.

Se auditarán cotizaciones, facturas, recibos y anticipos, ventas por vendedor, presupuestos, OT, entregas, cierres reales, proyectos y anticipos, PDF/impresión, resúmenes financieros e inventario.

## Fuentes originales y destino previsto

| Fuente V106.62 | Entidad nueva / consulta SQL | Control |
|---|---|---|
| `cotiz-historial` | Cotizaciones y partidas | Un registro por ID/numero comercial, estados |
| `fact-historial` | Facturas y partidas | Total fiscal separado de cobro y anticipos |
| `recibo-historial` | Recibos y aplicaciones | Abonos, pagos, reversos, saldos |
| `presup-historial` | Presupuestos y partidas/costos | Campos numéricos opcionales y relaciones |
| `ot-historial` | OT y movimientos | Referencia exacta, sin coincidencias de texto |
| `entrega-historial` | Entregas y líneas | Informe completo, cantidades pendientes |
| `cierre-historial` | Cierres reales | Costo, venta y margen válidos |
| Cotizaciones + facturas | Ventas por vendedor | Atribución verificable, orígenes sin vendedor |
| Cotizaciones + OT + recibos + facturas | Proyectos y anticipos | Conciliación de documentos y saldos |
| Inventario Maestro + Kardex | Inventario y reportes | Existencias y movimientos, sin doble conteo |

## Hallazgos priorizados

- **H-01 (crítico):** múltiples envoltorios/redefiniciones de `renderInformes` (V82, V85, V87, V106.29). **Acción:** una capa de consulta SQL y una capa de presentación; evitar parches, renderizadores y cálculos duplicados.
- **H-02 (crítico):** `calcularIngresosRealesEnConjunto()` combina facturación/recibos y limita con cotizaciones. **Acción:** separar cotizado, facturado, cobrado y saldo por aplicaciones válidas; no confundir ingreso cobrado con factura emitida.
- **H-03 (crítico):** vínculos OT ↔ cotizaciones por `includes()` sobre textos. **Acción:** IDs/foreign keys exactos; las relaciones ambiguas históricas van a excepciones de migración.
- **H-04 (crítico):** falta sección específica de entregas en el Centro de Informes. **Acción:** reporte de entregas desde la fuente canónica, con PDF/impresión.
- **H-05:** factura por vendedor a partir de cotización; manejar facturas sin origen/vendedor, anuladas y agrupaciones históricas.
- **H-06:** `margenPct.toFixed(1)` y `gananciaPct.toFixed(1)` pueden romperse con datos incompletos; aplicar validación y distinguir ausente de cero.
- **H-07:** pantalla e impresión/PDF usan rutas distintas; deben consumir exactamente el mismo conjunto filtrado y el mismo cálculo.
- **H-08:** estados `nulo`, `anulada`, eliminación histórica. Definir estados y políticas por tipo; conservar trazabilidad, no borrar ni mutar históricos al generar informes.

## Contratos de integridad del nuevo ERP
1. Cada documento tiene UUID inmutable; número comercial original completo conservado; abreviación solo en visualización.
2. Relaciones mediante claves externas validadas por empresa/división. Las ambigüedades se reportan, nunca se relacionan por coincidencia parcial.
3. Un solo origen oficial para cada tipo de documento; informes como consultas/vistas, no historiales duplicados.
4. Total cotizado ≠ total facturado ≠ cobrado ≠ saldo. Aplicaciones de recibos y anticipos con trazabilidad y reversos.
5. Anulaciones y correcciones auditables; nada desaparece silenciosamente.
6. Operaciones financieras y de inventario transaccionales e idempotentes.
7. PDF, impresión y pantalla utilizan filtros, estados, totales y conjuntos de registros idénticos.
8. Campos históricos faltantes se toleran explícitamente sin inventar valor; no modificar datos originales durante informes.
9. Inventario Maestro solo representa físico; el Catálogo de Costos nunca crea stock automáticamente.
10. Mantener V106.62 y SOE-HN completamente intactos.

## Criterios obligatorios por módulo (Definition of Done)
- [ ] Registro, lectura, edición autorizada, estados y trazabilidad comprobados.
- [ ] Identidad y vínculos exactos; sin documentos duplicados.
- [ ] Tests de casos normales y extremos, históricos incompletos y anulaciones.
- [ ] Conciliación de cantidad de registros, exclusiones y totales.
- [ ] Pruebas de autorización/RLS, concurrencia e idempotencia según corresponda.
- [ ] Informes asociados y PDF/impresión con exactamente las mismas cifras.
- [ ] Validación sin escrituras a datos productivos y respaldo verificable antes de cualquier corte.
- [ ] Evidencia de resultados automatizados y revisión funcional antes de promover a `main`.

## Orden de trabajo
1. Inventario de históriales/entidades y mapeo de vistas originales.
2. Implementar catálogo, clientes, cotizaciones, presupuesto y OT, validando cadenas documentales.
3. Continuar compras, inventario/kardex, entregas, facturas, recibos, anticipos y cierres.
4. Consolidar informes desde SQL como **única fuente de consulta**, incluyendo entregas.
5. Validar regresión funcional y paridad pantalla/PDF.
6. Solo entonces preparar carga histórica de staging, conciliación y activación controlada.

**Nota:** Este informe es una especificación de auditoría y aceptación, no evidencia de correcciones ya implantadas ni de datos productivos reconciliados.
