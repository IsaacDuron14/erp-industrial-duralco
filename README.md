# ERP Industrial DURALCO 2.0

Proyecto de migración y modernización del ERP COREBOLT a una arquitectura modular con PostgreSQL/Supabase, Next.js y TypeScript.

## Alcance inicial

- Migrar COREBOLT a SQL con integridad documental y trazabilidad.
- Mejorar cotizaciones, presupuestos, órdenes de trabajo, inventario, compras, facturas, recibos e informes.
- Preparar una arquitectura extensible para futuras divisiones industriales, sin integrarlas en esta primera etapa.
- Mantener acceso y base de datos independientes de SOE-HN.

## Reglas de seguridad y despliegue

- No modificar ni reemplazar el ERP COREBOLT actual durante el desarrollo.
- No modificar SOE-HN ni su base de datos.
- No incorporar datos reales de clientes, respaldos productivos, contraseñas, claves, tokens ni archivos .env al repositorio.
- Realizar migraciones con datos anonimizados, pruebas de integridad y reconciliación antes de cualquier cambio de operación.
- No desplegar sobre producción sin validación funcional y respaldo verificado.

## Estado

Fase 0: inicialización del nuevo repositorio y diseño técnico. El esquema SQL y la aplicación aún no están implementados.
