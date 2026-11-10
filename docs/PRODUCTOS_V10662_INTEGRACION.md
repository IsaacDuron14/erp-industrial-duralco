# Integración Productos / Tuercas / Arandelas — COREBOLT V106.62

**Estado:** Pantalla y cálculo integrados en rama de desarrollo. **No aprobado aún como módulo funcional SQL.**

## Implementación
- Pantalla `/productos` enlazada desde Catálogo.
- Categorías heredadas: TUERCA A563, TUERCA 2H, ARANDELA F436 y ARANDELA PRESION.
- Utiliza `calcTuerca` ya extraído de la V106.62; lista editable temporal, eliminar, buscar, totales y precio manual opcional.
- No se inventan precios: el usuario introduce un costo de referencia solo para simular. La configuración de producción deberá provenir de datos autorizados.
- No escribe en la base de datos ni modifica el catálogo, las cotizaciones o el inventario.
- Validaciones en pantalla: medida requerida, cantidad entera positiva, costo y precio finitos no negativos; no permite una línea con costo y precio ambos cero.
- El cálculo heredado aplica el ISV por defecto de 15 % cuando no hay precio manual. Su interpretación exacta y configuración requieren comparación funcional con V106.62 y con documentos PDF originales.

## Pruebas pendientes
- Compilación completa TypeScript y despliegue del sitio.
- Abrir `/productos` y probar agregar, editar, quitar, filtrar, borrar y recargar.
- Verificar cálculos con una muestra de configuraciones históricas autorizadas, además de casos sintéticos.
- Definir política aprobada de precios, ISV y autorizaciones.
- Diseñar y probar persistencia SQL y RLS; garantizar separación catálogo vs inventario físico.
- Asegurar equivalencia con cotizaciones y exportación PDF antes de declarar finalizado.

## Integridad documental
**Ningún producto temporal puede generar cotización ni alterar el stock físico.** La migración de configuraciones y registros de V106.62 se realizará solo después de integrar y validar todos los módulos.
