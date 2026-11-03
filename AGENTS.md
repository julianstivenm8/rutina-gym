# Instrucciones del proyecto

## Stack acordado con Julián

- Frontend: Next.js App Router, React, TypeScript, shadcn/ui y Tailwind CSS.
- Formularios: React Hook Form y Zod.
- Estado de aplicación: Zustand.
- Contenido: Sanity.
- Correo transaccional: Resend.
- Autenticación: Better Auth; el primer proveedor de acceso es Google.
- Base de datos: PostgreSQL en Neon, con Drizzle ORM y migraciones versionadas.

Este es el stack elegido para el proyecto. Usar cada herramienta cuando la funcionalidad la necesite; no añadir proveedores alternativos ni dependencias sin uso. Las versiones instaladas se consultan en `package.json` y `package-lock.json`.

## Convenciones

- Priorizar Server Components y mantener las interacciones en componentes cliente acotados.
- Usar shadcn/ui para nuevos componentes de interfaz y Tailwind para sus estilos. Conservar la paleta salvia, lavanda y coral, las fuentes locales y los temas claro/oscuro.
- El selector de tema está en el header. El tema inicial sigue al sistema y su elección manual no se almacena en el navegador.
- Usar Better Auth como fuente de verdad de usuarios y sesiones. No guardar tokens ni duplicar sesiones en Zustand o en almacenamiento del navegador.
- Verificar la sesión en el servidor al servir rutas y acciones protegidas. Una cookie presente o una comprobación visual del cliente no autentican al usuario.
- Mantener secretos y conexiones en variables de entorno del servidor. Documentar sus nombres en `.env.example`; nunca incluir credenciales en código, logs o commits.
- Revisar las migraciones antes de aplicarlas y confirmar la base de datos de destino. No usar operaciones destructivas para implementar cambios de esquema.
- La autenticación requiere un servidor Next.js; no volver a configurar `output: "export"`.
- Mantener la interfaz en español y adaptar la navegación a celular y tablet.

## Reglas de la rutina

- Calcular la fecha en `America/Bogota`, con semanas ISO que empiezan el lunes.
- Semana ISO par: rutina 1. Impar: rutina 2. La transición 53 → 1 puede repetir la rutina 2.
- Conservar nombres, anotaciones y orden de los ejercicios suministrados por el usuario. Las listas dependen de la rutina y del día.
- La hoja «Rutinas Fuerza cardio» es una referencia de contenido; no modificarla ni añadir una sincronización en ejecución salvo que el usuario lo solicite.
- No inventar ejercicios, series, repeticiones, pesos ni pulsaciones objetivo.
- No añadir historial de entrenamientos, seguimiento, notificaciones ni integraciones ajenas a la tarea solicitada.

## Comprobaciones

- Ejecutar las pruebas existentes y la compilación para los cambios de comportamiento.
- Añadir pruebas que verifiquen límites y resultados reales de autenticación; no sustituir Google OAuth por una sesión simulada en producción.
- Indicar qué parte del flujo se comprobó y si falta configurar algún servicio externo.
