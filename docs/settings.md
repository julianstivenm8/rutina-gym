# Configuración de la cuenta

`/configuracion` se abre desde la zona inferior del menú lateral. La página y sus acciones comprueban la sesión en el servidor con Better Auth.

## Opciones disponibles

- **Apariencia:** Sistema, Claro y Oscuro, con vistas previas independientes. El selector y el botón del header comparten el estado; el modo Sistema sigue los cambios del dispositivo. La selección manual vive en memoria y se reinicia al recargar, sin cookies de preferencia ni almacenamiento del navegador.
- **Acceso:** el método actual es Google. El enlace «Gestionar en Google» abre su configuración de seguridad. No se habilita acceso con contraseña, cambio de contraseña local ni envío de correo; esa funcionalidad queda para una tarea futura.
- **Sesiones activas:** muestra una descripción del navegador y sistema, su inicio y vencimiento, e identifica el dispositivo actual. No representa un historial de actividad. «Cerrar otras sesiones» utiliza Better Auth y conserva la actual. «Cerrar sesión aquí» elimina la sesión del dispositivo, manteniendo sus datos de cuenta.
- **Datos de la cuenta:** nombre, correo, fecha de creación y cantidades de rutinas, registros de peso y registros corporales.
- **Eliminar cuenta:** diálogo con el alcance de la eliminación, cantidades de datos y confirmación escribiendo el correo de la cuenta y ELIMINAR. La cancelación conserva la cuenta. Una solicitud fallida mantiene el diálogo para revisarla o reintentar.

## Eliminación y autenticación

El servidor exige una sesión creada hace menos de diez minutos, un origen autorizado, un cuerpo válido sin campos adicionales y la coincidencia del correo con el usuario autenticado. Si hace falta renovar el acceso, la interfaz ofrece Google y vuelve a Configuración sin eliminar automáticamente la cuenta. El usuario debe confirmar nuevamente la operación.

La eliminación la ejecuta `getAuth().api.deleteUser`, con `user.deleteUser.enabled: true`. Se preservan la verificación de sesión de Better Auth y sus cookies. Las rutas HTTP nativas `/api/auth/delete-user` y `/api/auth/delete-user/callback` se desactivan para que la confirmación de la aplicación no pueda omitirse usando esos accesos; la API de servidor sigue disponible. El umbral `session.freshAge` queda explícito en 600 segundos.

Las claves foráneas existentes eliminan las rutinas, selección activa, ejercicios, registros de peso, perfil corporal, registros corporales y medidas al eliminar el usuario. Better Auth elimina además sus cuentas de proveedor y sesiones. Esto elimina la cuenta de Mi rutina; no elimina la cuenta de Google ni permite elegir el identificador de otra persona.

Las respuestas son privadas y sin caché. La interfaz recibe solo los metadatos de sesiones necesarios para mostrarlas; los tokens, direcciones IP, credenciales OAuth y cadenas de conexión permanecen en el servidor. El nombre del dispositivo se obtiene de una descripción resumida del agente del navegador.

## Rutas

- `GET /api/settings`: datos de la propia cuenta y sesiones activas, sin parámetros de propietario.
- `POST /api/settings/sessions`: `{ "action": "revoke-others" }`.
- `DELETE /api/settings/account`: `{ "confirmation": "ELIMINAR", "email": "correo-de-la-cuenta" }`.

No se añaden tablas, migraciones, dependencias de ejecución, variables de entorno ni servicios externos. Se reutilizan Google, Better Auth y Neon ya configurados. El diálogo usa el componente Alert Dialog de shadcn y Radix ya instalado.

Referencias contrastadas con el código instalado de Better Auth 1.7.15: [gestión de usuarios](https://better-auth.com/docs/concepts/users-accounts), [sesiones](https://better-auth.com/docs/concepts/session-management) y [rutas desactivadas](https://better-auth.com/docs/reference/options#disabledpaths).

## Verificación

```sh
npm test
npm run test:settings
npm run test:auth
npm run test:routines
npm run test:weights
npm run test:body
npm run build
```

La suite de Configuración crea cuentas temporales y sesiones comprobadas por Better Auth. Verifica los límites de confirmación, la antigüedad de la sesión, aislamiento entre cuentas, ausencia de tokens en la respuesta, cierre de otras sesiones, arranque del flujo real de Google y eliminación completa de datos relacionados con invalidación de la cookie. La confirmación interactiva en Google sigue siendo una acción del usuario; las pruebas no la sustituyen en producción.
