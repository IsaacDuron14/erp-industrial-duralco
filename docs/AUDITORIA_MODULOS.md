# Auditoría de integración V106.62 → COREBOLT 2.0

Fuente: archivo ZIP `corebolthn_v106_62_CAPACITACION_FUNCIONAL(1).zip` (solo análisis; no se suben datos productivos).

Vistas detectadas en index.html (27): pernos, placas, tuercas, cotiza, respaldo, capacitacion, agente, inventario, bancos, recibo, factura, entrega, presupuesto, ot, cierre, dashboard, informes, cliente360, cuentas, finanzas, ordencompra, operarios, asistencia, produccionot, costos, auditoria, accesos.

## Orden de trabajo

| Fase | Módulo | Estado |
|---|---|---|
| 0 | Infraestructura, Next.js, conexión Supabase | Estructura inicial en desarrollo |
| 1 | Clientes | Primera pantalla, SQL y RLS inicial; pruebas E2E pendientes |
| 2 | Catálogo (pernos, placas, tuercas, costos) | Pendiente |
| 3 | Cotizaciones | Pendiente |
| 4 | Presupuestos y OT | Pendiente |
| 5 | Inventario, compras y producción | Pendiente |
| 6 | Facturas, recibos, bancos y finanzas | Pendiente |
| 7 | Entregas, cierre, informes, capacitación y administración | Pendiente |
| 8 | Migración de históricos y reconciliación | Únicamente después de validar el sistema |

## Hallazgos iniciales

- Clientes se almacenan en V106.62 bajo la llave `cotiz-clientes` por funciones `storageGet/storageSet`.
- El cliente original tiene los atributos `codigo`, `nombre` y `rtn`; hay altas por múltiples rutas y comparación de nombres sin normalización integral.
- En SQL se usa UUID interno y correlativo comercial independiente.
- La tabla `clientes` ya existía en Supabase Industrial; se añadieron políticas RLS restrictivas y una empresa/división de prueba. No hay usuarios autorizados asignados todavía.
- No usar datos productivos, no fusionar a main y no anunciar versión funcional hasta ejecutar pruebas autenticadas.

## Control de integridad

Verificar: registrar, consultar, evitar código duplicado, permisos de lectura/escritura, trazabilidad de clientes referenciados por cotizaciones, errores de red y recarga. Nunca conectar producción de SOE-HN.
