# Integración módulo 2 — Catálogo Maestro (V106.62 → SQL)

## Fuente técnica
ZIP original `corebolthn_v106_62_CAPACITACION_FUNCIONAL(1).zip`.
Configuraciones históricas identificadas: `bolt-config`, `bolt-materiales`, `bolt-params`, `placa-config`, `placa-espesores`, `placa-params`, `tuerca-config`, `tuerca-params`. Los módulos operativos de V106.62 para pernos, placas y tuercas incluyen calculadoras propias.

## Entrega (fase inicial)
- SQL: se amplía `catalogo_insumos` con `tipo`, `precio_venta`, `parametros` JSON y fecha de actualización.
- Seguridad: RLS con membresía activa, división COREBOLT, permisos separados para lectura, creación y actualización.
- UI: `/catalogo`, búsqueda, filtro por familia, edición autorizada y paginación visual de 10 registros.
- Datos: **0 históricos importados**. El Catálogo Maestro no alimenta automáticamente Inventario Maestro.
- Exclusiones deliberadas: los algoritmos y parámetros completos de las calculadoras de pernos, placas y tuercas **aún no se migraron**; se integrarán conservando la lógica funcional antes de la etapa de cotización.
- Precisión: campos numéricos `numeric(18,4)` para importes unitarios. Las operaciones finales de venta requerirán reglas de redondeo propias y pruebas.

## Criterios para declarar funcional
1. Completar login administrador de Supabase Auth.
2. Ejecutar despliegue Netlify y comprobar que `/catalogo` abre sin errores.
3. Crear referencia ficticia con tipo, familia, unidad y precio; comprobar persistencia tras recarga.
4. Rechazar código duplicado dentro de la misma división.
5. Editar solo con roles autorizados, y rechazar cuentas sin membresía o división.
6. Validar que crear una referencia no genere stock en Inventario Maestro.
7. Comprobar que la búsqueda y paginación mantengan resultados correctos con más de 10 registros.

## Riesgos y tareas
- La consulta UI está limitada temporalmente a 1000 referencias y usa paginación local; sustituir por paginación SQL antes de producción.
- No se ha probado compilación CI ni flujo autenticado end-to-end.
- Falta auditoría automática para cambios de precios y reglas de aprobación.
- Próximo submódulo: calculadoras de pernos/placas/tuercas y sus configuraciones técnicas, previa validación V106.62.
