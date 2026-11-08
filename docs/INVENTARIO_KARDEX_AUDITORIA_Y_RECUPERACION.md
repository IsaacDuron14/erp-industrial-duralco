# Inventario Maestro y Kardex — auditoría de riesgos y ruta acordada

**Fuente:** V106.62 `index.html`, inspección estática del 8/11/2026.
**Criterio aprobado:** Importar saldos originales **en cuarentena/pendientes de conciliación**, contrastarlos con Kardex, órdenes de compra y requisiciones, habilitarlos solo tras verificar diferencias; **después reparar y mejorar** el módulo que no ha funcionado satisfactoriamente.
**Alcance:** COREBOLT 2.0 independiente. No modificar original ni importar a SQL activo en esta etapa.

## Corrección sustancial de la auditoría previa: respaldo ampliado

- La constante inicial `BACKUP_KEYS` tiene 57 claves y **no** incluye Inventario Maestro/Kardex.
- **PERO el código posterior redefine `window.exportarRespaldo`** mediante `backupKeys93()` (aprox. líneas 22006–22043) y **sí agrega 13 claves**, incluyendo:
  `inventario-maestro-v1`, `inventario-kardex-v1`, `inventario-costeo-v1`, `inventario-requisiciones-v1`, `inventario-precios-fusion-v89`, `factura-informe-ajustes-v87`, `prod-categorias`, `prod-divisiones`, `fact-counter-fiscal-v2`, `presup-counter`, `agente-chat`, `agente-api-url`, `personal-operarios-seed-v66`.
- Por tanto un respaldo producido por **la función efectiva de exportación V106.62** intenta incluir **70 claves únicas**, no solo 57. Es crucial verificar que esas claves realmente tengan valores no nulos, que no haya fallos de lectura y que el respaldo corresponda al entorno de operación.
- Las 9 claves mencionadas anteriormente como “fuera de BACKUP_KEYS” siguen fuera de la **lista inicial**, pero en gran parte están incorporadas por el exportador final. La lista anterior no era un diagnóstico definitivo de respaldo incompleto.
- La exportación incluye también `auth-config` y `agente-api-url` potencialmente sensibles: **no almacenar un respaldo sin cifrar en GitHub ni compartirlo por enlaces públicos**. Gestionar secretos por canal seguro y no importar tokens heredados al frontend nuevo.

## Cómo calcula V106.62 las existencias

En el código base (aprox. líneas 16663–16734):
- `inventarioMaestro`: objeto por artículo con `id,nombre,clase,unidad,minimo,stock,legacyTipo,legacyKey,nota,entradasOC` (campos variables).
- `kardexInventario`: lista de movimientos.
- `requisicionesMaestro`: documentos de requisición.
- Los artículos heredados `legacyTipo = pernos | placas | tuercas` obtienen su saldo de **`disponibleNativo(tipo,legacyKey)`**, no directamente de `item.stock`.
- Los artículos no heredados usan `item.stock`. La presentación convierte a unidades de compra con `factorCompraBase` (pulgadas/barra, mm²/lámina, piezas).
- `sincronizarInventarioMaestroLegacy` crea referencias técnicas en el Maestro si no existen, incluso con saldo nulo. Más adelante la auditoría v79 distingue “puentes” de catálogo versus existencias reales; **no importar referencias vacías como stock físico**.
- `imDisponibleBase` limita la existencia presentada con `Math.max(0, ...)`. **Riesgo:** puede ocultar saldos negativos de origen si se toma la cifra visible en vez del dato crudo. Guardar ambas cifras para conciliación.

## Operaciones que generan Kardex

| Acción | Evidencia V106.62 | Movimiento |
|---|---|---|
| Recepción de OC | `confirmarRecepcionOC` y variantes posteriores, aprox. 17153, 17330 y 23881 | `ENTRADA_OC` |
| Entrega real de bodega a OT | `confirmarRequisicionOT`, aprox. 17350–17395 | `SALIDA_OT` |
| Devolución a almacén | lógica Kardex/OT, aprox. 17766 | `DEVOLUCION_OT` |
| Saldo inicial y ajustes | tipos `AJUSTE_INICIAL`, `AJUSTE`, `AJUSTE_CORRECCION` | Evidencia de regularización manual |
| Costeo | `inventario-costeo-v1`, `reconciliarCosteoV59`, líneas 17562+ | Libro de costo asociado a Kardex |

## Riesgos comprobables en el código (sin afirmar que ocurrieron en producción)

1. **Guardado no atómico:** confirmación de OC y entrega OT escriben secuencialmente las existencias, el Kardex y el documento/requisición por separado. Si falla conexión entre pasos puede producir diferencias temporales o permanentes; se implementaron marcas e idempotencia de reintentos, pero no hay transacción SQL integral.
2. **Múltiples fuentes de saldo:** legado por familia + Maestro. Evitar sumar ambos como artículos distintos.
3. **Coexistencia de formatos:** el libro de costeos, registros de ajustes y las marcas por operación pueden venir de versiones anteriores. Importar sin perder atributos.
4. **Sobrescritura de renderizadores:** `window.renderInventarioMaestro` aparece redefinido en varias capas (p. ej. 20557, 20700, 20823, 21056, 21559, 21650, 23177). Revisar la definición efectiva y los efectos laterales antes de replicar interfaz; no usar versiones antiguas de esas funciones.
5. **Depuración/archivo:** la auditoría v79 permite archivar referencias sin historia; no fusionar registros con trazabilidad por similitud de nombre. La versión migrada debe preservar `archivadoV79` y el original de importación.
6. **Riesgo de cifras negativas ocultas:** `Math.max(0,...)` en cálculos de disponibilidad limita el negativo. Conciliar **saldo crudo y saldo mostrado**, con excepciones.
7. **Salidas parciales:** una requisición puede generar varios movimientos por OT; conservar `operacionId` cuando exista y reconstruir con cuidado los documentos sin dicho campo.
8. **Recepciones parciales / OC recibidas:** proteger contra duplicados de recepción, reversas y movimientos que no fueron inventariables.

## Política de importación del inventario (aprobada)

1. Capturar copia **completa** de respaldo V106.62 exportado desde función final y, cuando corresponda, estado remoto/local. Registrar fuente, fecha, huella/hash y claves ausentes.
2. En SQL de **staging**, guardar JSON íntegro del Maestro, Kardex, Costeo, requisiciones, OC e inventarios nativos por familia, conservando identificadores originales.
3. Generar vista de conciliación: existencia cruda de origen, existencia mostrada, suma neta del Kardex y costeos disponibles, unidades base/compra, entradas OC, salidas OT, devoluciones, ajustes y excepciones.
4. **No asumir que saldo Kardex = saldo actual** si falta historia o saldo inicial. Clasificar: `conciliado`, `sin historia completa`, `diferencia`, `unidad incompatible`, `duplicado/ambigüedad`, `origen no legible`.
5. Autorizar individualmente correcciones de diferencias y activación de saldos. Importar balances aprobados **sin reescribir ni inventar transacciones históricas**.
6. **Después** clonar y reparar operaciones de stock: entradas solo por recepción física de OC, salidas por entrega confirmada a OT, devolución, ajustes autorizados y costo real versus mercado. Mantener pruebas de equivalencia y documentación de cambios como versión posterior.

## Criterios de aceptación posteriores

- Un OC recibida produce entradas de cada línea inventariable **una sola vez**, aun con reintentos/concurrencia.
- Una requisición parcial solo descuenta cantidad físicamente entregada, nunca necesidad teórica.
- Existencia = saldo aprobado + movimientos posteriores; no se genera stock al añadir una referencia de catálogo.
- No existen diferencias invisibles entre Kardex y Maestro; faltantes se muestran para corrección autorizada.
- Transacciones SQL actualizan documento + stock + Kardex de forma **atómica**, con idempotencia y controles de concurrencia.
- Unidades y factores de conversión no cambian retroactivamente los movimientos registrados.
- Costeo histórico y total real/de mercado se muestran diferenciados, sin inventar costo cuando falte evidencia.
- Una devolución o ajuste conserva el movimiento previo y añade contra-movimiento trazable.
- Las 27 vistas no requieren cambios de negocio durante clonación; las mejoras de Inventario/Kardex irán como versión posterior controlada.

## Bloqueo de seguridad

No manipular `auth-config` ni copiar tokens de Worker al SQL visible; no publicar respaldos ni claves.
