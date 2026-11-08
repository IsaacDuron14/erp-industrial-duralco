# COREBOLT 2.0 — Bitácora de clonación funcional V106.62

**Estado: réplica parcial en rama de desarrollo; NO es ERP terminado ni reemplazo de producción.**
**Fecha de referencia:** 2026-11-08.

## Trabajo implementado sin necesidad de datos productivos

| Módulo | Extracción / lógica | Pantalla en Next.js | Persistencia SQL | Comparación |
|---|---|---|---|---|
| Pernos | `lib/corebolt/v10662/pernos.ts`: 32 combinaciones y fórmulas `calcBolt`, detalle/sufijo | `/pernos`: parámetros, configuración, formulario, lista editable temporal, resumen | **No** | 5 casos de referencia originales reproducidos para tests |
| Placas | `lib/corebolt/v10662/placas.ts`: 12 espesores; geometría, corte, perforaciones, peso, precio y rendimiento | `/placas`: parámetros, precio, formulario por geometría, lista temporal, resumen | **No** | 5 casos de referencia originales reproducidos para tests |
| Productos/Tuercas | `lib/corebolt/v10662/productos.ts`: calculadora, categorías históricas y coincidencia canónica | Pendiente: requiere formato y catálogo original | **No** | Tests de fórmula con configuraciones sintéticas |
| Cotización, Presupuesto, OT, Factura, Recibo | Contratos documentados | Pendientes | Esquemas SQL preliminares, sin uso real | Pendiente |

## Archivos de verificación

- `tests/pernos-v10662.test.cjs`: tabla de valores calculados ejecutando **el JavaScript original** desde la copia de V106.62, cinco escenarios representativos, parámetros, catálogo y detalles.
- `tests/placas-v10662.test.cjs`: resultados equivalentes calculados desde el código original, cinco formas/variantes.
- `tests/productos-v10662.test.cjs`: catálogo históricamente configurable y cálculos sintéticos.
- `.github/workflows/validacion-v10662.yml`: ejecuta `npm test` y `npm run typecheck` al actualizar la rama de integración. **No se confirma ejecución exitosa de CI hasta revisar la salida de GitHub Actions.**

## Precauciones explícitas

1. Las listas de Pernos y Placas actuales se mantienen en memoria; al recargar la página se pierden. Se indica en pantalla.
2. **No** se leen históricos, no se graban borradores SQL, no se emiten correlativos y no se modifica inventario.
3. Los precios que aparecen son referencias **iniciales del código V106.62**, no los precios actuales del ERP; valores de producción dependen de `bolt-config`, `placa-config` y `tuerca-config` recuperados del respaldo.
4. La función original de agregar pernos/placas rechaza combinaciones con precio de barra/lámina 0; las pantallas de prueba mantienen ese comportamiento.
5. Los controles de editar precios, autorizaciones, conversiones completas, PDFs, cotizaciones, clientes y guardado compartido **todavía no están integrados**. No presentarlos como terminados.
6. Se detecta ISV del 15% fijo en algunos lugares de la visualización original; se conserva el resultado de `calcBolt` y `calcPlaca`, pero la paridad total de la pantalla y documentos sigue pendiente.
7. El encabezado actual utiliza marcas tipográficas provisionales `D/CB`, no los logos gráficos originales.
8. El sitio publicado en Netlify no fue accesible desde la herramienta de verificación externa; **deployment pendiente de comprobar**.
9. La base SQL preliminar permanece con 0 cotizaciones, presupuestos y órdenes de trabajo importados. Ningún dato real se ha migrado.
10. No se copiaron secretos ni tokens incrustados en el archivo monolítico V106.62.

## Próximos pasos SIN participación del usuario

- Revisar CI GitHub Actions y corregir errores de TypeScript, tests o despliegue.
- Terminar fidelidad visual de Pernos/Placas con logos, campos y acciones reales.
- Extraer vista Productos/Tuercas, Cotización y estructura de borradores a un modelo sin modificar cálculos.
- Preparar un diseño SQL de staging y equivalencia que no importe datos reales sin autorización.
- Definir casos de prueba y fixtures adicionales para regresiones de interfaz y documentos.

## Puntos de validación del usuario (más adelante)

- Aprobar paridad visual y funcional de los módulos terminados contra V106.62.
- Proporcionar exportación autorizada/cifrada para cargar precios de configuración/históricos reales y conciliar saldos.
- Autorizar cada corte operacional y activación de inventario conciliado.
