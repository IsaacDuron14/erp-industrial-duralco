# Primer acceso — COREBOLT 2.0 (solo desarrollo)

## Estado

No existe aún un administrador autorizado en el nuevo Supabase. No hay clientes productivos ni históricos migrados.

## Paso 1. Cuenta Auth

En https://supabase.com/dashboard/project/ifqjgkcnorrcxlefdewd/auth/users crear o invitar un usuario real de prueba mediante el panel de Supabase. No escribir contraseñas en GitHub ni compartirlas en el chat. Confirmar la cuenta y copiar su UUID desde el panel.

## Paso 2. Asignar empresa y división

Solo dentro del proyecto Duralco-Industrial-Dev, ejecutar en SQL Editor el siguiente bloque, reemplazando el UUID con el del usuario de pruebas:

```sql
BEGIN;
INSERT INTO public.usuarios_empresas(usuario_id,empresa_id,rol,activo)
SELECT '<UUID_DEL_USUARIO>'::uuid,e.id,'administrador',true
FROM public.empresas e WHERE e.nombre='GRUPO DURALCO'
ON CONFLICT(usuario_id,empresa_id) DO UPDATE SET rol=EXCLUDED.rol,activo=true;
INSERT INTO public.usuarios_divisiones(usuario_id,empresa_id,division_id)
SELECT '<UUID_DEL_USUARIO>'::uuid,d.empresa_id,d.id
FROM public.divisiones d WHERE d.codigo='COREBOLT'
ON CONFLICT(usuario_id,division_id) DO NOTHING;
COMMIT;
```

## Paso 3. Netlify independiente

Importar el repositorio `IsaacDuron14/erp-industrial-duralco`, seleccionar temporalmente la rama `desarrollo/integracion-modulos` como despliegue de desarrollo y configurar estas variables de entorno en Netlify:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://ifqjgkcnorrcxlefdewd.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = clave PUBLICABLE activa, obtenida en Supabase → Project Settings → API Keys

No agregar service_role, secret keys, base de datos ni contraseña al cliente web. Evitar publicar un entorno de prueba con datos reales.

## Paso 4. Pruebas

1. Entrar a /clientes con usuario habilitado.
2. Crear un cliente ficticio con código único.
3. Refrescar: verificar persistencia.
4. Repetir código: verificar rechazo por restricción SQL.
5. Cerrar sesión y comprobar que se bloquea el acceso.
6. Verificar que un usuario sin membresía no pueda leer ni crear clientes.
7. Revisar errores de consola y tiempos de respuesta.

No migrar históricos hasta concluir la integración y las pruebas de todos los módulos.

## Cuenta solicitada

Correo administrador previsto: `Duralconsructores@gmail.com`.

En Supabase Dashboard → Authentication → Users → Invite user, invitar esta dirección de correo. Aceptar la invitación desde el buzón y definir una contraseña robusta (mínimo recomendado 12 caracteres). No usar `1234` ni colocar contraseñas en repositorios.

Después de que el usuario de Auth exista, utilizar su UUID en la asignación de membresía y división indicada arriba. Configurar Authentication → URL Configuration → Site URL y Redirect URLs con el dominio real de Netlify y `https://<dominio>/cuenta`, para que funcione el correo de recuperación.

La nueva página `/cuenta` permite recuperar el acceso por correo y cambiar la contraseña después de autenticarse. Su funcionamiento requiere configurar previamente el sitio y el servicio de correo de Supabase.
