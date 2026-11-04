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
- La rutina original es la predeterminada para todos los usuarios, en una copia propia por cuenta: semana ISO par, rutina 1; impar, rutina 2. La transición 53 → 1 puede repetir la rutina 2.
- Las rutinas personalizadas admiten de 1 a 12 semanas con siete días cada una. El ciclo continuo se calcula desde un lunes elegido, sin reiniciarse al cambiar de año.
- Guardar las rutinas privadas en Neon por usuario de Better Auth. Una cuenta solo puede tener una rutina activa; conservar la restricción de propiedad y unicidad de la selección en la base de datos.
- Conservar nombres, anotaciones y orden de los ejercicios suministrados por el usuario. Las listas dependen de la rutina y del día.
- La hoja «Rutinas Fuerza cardio» es una referencia de contenido; no modificarla ni añadir una sincronización en ejecución salvo que el usuario lo solicite.
- No inventar ejercicios, series, repeticiones, pesos ni pulsaciones objetivo.
- El registro opcional de pesos por ejercicio está autorizado: conservar cada cambio con unidad y fecha por cuenta, sin inventar valores. Las estadísticas se desarrollarán en otra feature.
- No añadir historial de sesiones, seguimiento de entrenamientos completados, notificaciones ni integraciones ajenas a la tarea solicitada.

## Comprobaciones

- Ejecutar las pruebas existentes y la compilación para los cambios de comportamiento.
- Añadir pruebas que verifiquen límites y resultados reales de autenticación; no sustituir Google OAuth por una sesión simulada en producción.
- Indicar qué parte del flujo se comprobó y si falta configurar algún servicio externo.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
