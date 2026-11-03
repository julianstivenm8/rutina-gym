# Acceso con Google

El flujo usa Better Auth, su adaptador de Drizzle y PostgreSQL en Neon. Las pantallas y componentes nuevos usan shadcn/ui con los colores de la aplicación.

## Rutas

- `/iniciar-sesion`: entrada con Google; si ya existe una sesión válida, redirige a `/`.
- `/`: consulta la sesión en el servidor y muestra la rutina únicamente al usuario autenticado. Una petición sin sesión se redirige a `/iniciar-sesion`.
- `/api/auth/[...all]`: endpoints de Better Auth, incluido `/api/auth/callback/google`.
- El header muestra el nombre, correo y cierre de sesión. El cliente recibe únicamente esos datos del perfil; no recibe la sesión del servidor ni sus tokens.

El primer acceso con Google crea la cuenta y los posteriores usan la misma cuenta. No se habilita acceso con correo y contraseña. Los errores de OAuth permiten volver a intentarlo y un cierre de sesión fallido conserva la pantalla actual para reintentar.

## 1. Instalar dependencias

```sh
npm install
```

Las dependencias y sus versiones están registradas en `package-lock.json`; también se puede usar `npm ci` para una instalación reproducible.

## 2. Preparar la configuración local

Usar `.env.example` como referencia. Si ya existe `.env.local`, completar ese archivo conservando su secreto generado. En una instalación nueva, crear `.env.local` y generar el secreto con:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Variables del servidor:

| Variable | Valor |
| --- | --- |
| `BETTER_AUTH_URL` | `http://localhost:3000` en desarrollo; origen HTTPS del despliegue en producción. |
| `BETTER_AUTH_SECRET` | Secreto aleatorio de al menos 32 caracteres, estable entre despliegues del mismo entorno. |
| `DATABASE_URL` | Connection string de la base de datos de Neon. |
| `GOOGLE_CLIENT_ID` | ID del cliente OAuth de Google de tipo aplicación web. |
| `GOOGLE_CLIENT_SECRET` | Secreto del mismo cliente OAuth. |

```sh
npm run auth:check
```

El comando comprueba las variables y muestra la URL de callback, sin imprimir secretos. Si falta configuración, la pantalla de acceso informa de su indisponibilidad, el botón queda deshabilitado y los endpoints de autenticación responden `503`.

## 3. Crear las tablas en Neon

Crear o seleccionar la base de datos de Neon destinada a esta aplicación y copiar su connection string en `DATABASE_URL`.

La migración inicial está en `drizzle/0000_auth.sql`, junto con los metadatos de Drizzle. Revisarla, comprobar que `DATABASE_URL` apunta a la base de destino y aplicarla:

```sh
npm run db:migrate
```

El esquema en `src/db/schema.ts` define `auth_user`, `auth_session`, `auth_account`, `auth_verification` y `auth_rate_limit`. Las cuentas y sesiones referencian al usuario; la identidad de Google y el token de sesión tienen restricciones únicas. La tabla de verificación guarda el estado de OAuth. Better Auth cifra los tokens OAuth y utiliza la base de datos para el límite de peticiones.

Para futuros cambios del esquema, generar una nueva migración con `npm run db:generate -- --name=nombre-del-cambio`, revisarla y versionarla antes de aplicarla. No hace falta regenerar la migración inicial en cada instalación.

Si aparece `relation "auth_verification" does not exist`, faltan las tablas en la base configurada: ejecutar la migración revisada con `npm run db:migrate`. Las tablas del esquema `neon_auth` pertenecen a Neon Auth y no sustituyen las tablas `public.auth_*` de esta aplicación, que usa Better Auth directamente.

## 4. Configurar Google OAuth

En Google Cloud Console, configurar Google Auth Platform y crear un cliente OAuth de tipo **Aplicación web**.

Para desarrollo:

- Origen autorizado: `http://localhost:3000`.
- URI de redirección autorizada: `http://localhost:3000/api/auth/callback/google`.

En producción, registrar el origen de `BETTER_AUTH_URL` y el mismo origen seguido de `/api/auth/callback/google`. Usar un dominio estable para probar OAuth en despliegues de preview. Si el consentimiento está en modo de pruebas, añadir las cuentas de prueba en Google.

Copiar el ID y secreto en las variables del servidor. El proveedor solicita los permisos normales de identidad de Google; no añade permisos de Drive, Gmail ni Calendar.

## 5. Ejecutar y comprobar

```sh
npm run dev
```

Abrir **http://localhost:3000**, usando el mismo origen de `BETTER_AUTH_URL`.

1. Una visita sin sesión debe terminar en `/iniciar-sesion`.
2. Continuar con Google debe abrir su pantalla de acceso y devolver a `/` con la cuenta visible en el header.
3. Cerrar sesión debe llevar a `/iniciar-sesion`; volver a `/` debe pedir autenticación.
4. Cancelar OAuth debe permitir volver a intentar el acceso.
5. Comprobar ambos temas y navegación en celular y tablet.

```sh
npm test
npm run typecheck
npm run build
```

Con la aplicación local en ejecución y las cinco variables completas en `.env.local`, comprobar el inicio real de OAuth y los límites de acceso con:

```sh
npm run test:auth
```

Estas pruebas comprueban la redirección sin sesión, el rechazo de una cookie inventada, de peticiones con cookies desde un origen no autorizado y de callbacks externos, y el inicio de Google con persistencia real del estado OAuth en Neon. El estado creado por la prueba se elimina al terminar; no se crean usuarios ni sesiones de prueba. Solo se permiten destinos locales. `AUTH_TEST_BASE_URL` permite apuntar a otro puerto local manteniendo el callback de `BETTER_AUTH_URL`.

`npm test` omite estas pruebas cuando no hay una URL de prueba configurada. La comprobación automática no completa el consentimiento en Google: entrar con una cuenta y cerrar sesión sigue formando parte de la comprobación manual.

## Despliegue

La aplicación ahora necesita el servidor de Next.js. En Vercel, configurar las cinco variables para el entorno correspondiente, aplicar las migraciones a esa base de datos y desplegar el repositorio. No se usa `output: "export"` ni la carpeta `out/` como resultado de producción.

El manifiesto `.openai/hosting.json` corresponde al prototipo estático anterior y no aloja este flujo de autenticación. Esta tarea no ha publicado cambios ni modificado las variables del proyecto de Vercel.

La sesión utiliza cookies de Better Auth y validación en el servidor. La app no almacena tokens en Zustand, localStorage ni sessionStorage. El selector de tema continúa siguiendo al sistema por defecto.
