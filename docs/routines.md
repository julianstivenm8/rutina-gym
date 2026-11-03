# Rutinas por cuenta

El menú del header abre «Mi semana», «Mis rutinas» y «Crear rutina». El inicio conserva calendario, detalle del día y explicación del ciclo; sus datos proceden de la rutina activa del usuario.

## Contenido y calendario

Cada rutina contiene de 1 a 12 semanas ordenadas. Cada semana tiene exactamente siete días, de lunes a domingo. Cada día guarda tipo, nombre, notas, duración o estructura opcional y una lista ordenada de ejercicios con sus anotaciones. No se generan ejercicios ni prescripciones. Los entrenamientos de fuerza requieren al menos un ejercicio.

- La rutina original de fuerza y cardio es la predeterminada para todas las cuentas. Conserva sus dos semanas, 14 días, 50 ejercicios, orden y anotaciones. Semana ISO par: rutina 1; impar: rutina 2. La transición 53 → 1 puede repetir la rutina 2.
- Las rutinas nuevas usan por defecto un ciclo continuo desde el lunes elegido. El ciclo sigue durante todo el año sin reiniciarse en enero; antes del lunes de referencia se extiende el mismo patrón hacia atrás. Las rutinas de dos semanas también pueden usar alternancia par/impar.
- Todos los días y cambios de semana se calculan en `America/Bogota`.

El editor permite duplicar semanas, copiar un entrenamiento a otro día, pegar ejercicios de uno por línea y cambiar su orden con botones. «Guardar» conserva la selección activa; «Guardar y activar» cambia el inicio a esa rutina. Editar una rutina ya activa actualiza su contenido al guardar.

## Base de datos

Revisar `drizzle/0001_routines.sql`, confirmar `DATABASE_URL` y ejecutar:

```sh
npm run db:migrate
```

- `routine_plan` pertenece a un usuario de Better Auth. Su definición se guarda como un documento JSONB validado con Zod, que conserva el orden de semanas, días y ejercicios en una escritura.
- `routine_selection` tiene al usuario como clave primaria: solo puede seleccionar una rutina. Una clave foránea compuesta por rutina y usuario impide seleccionar rutinas de otras cuentas, incluso ante escrituras simultáneas.
- Guardar y activar usa una transacción de Neon. La migración crea el índice único antes de la relación que lo requiere.
- La migración asigna una copia de la rutina original a cada usuario existente. El servidor inicializa esa misma copia para usuarios nuevos de forma idempotente. Nunca reemplaza una selección activa existente.

Las páginas y cada endpoint comprueban la sesión en el servidor. Lecturas, ediciones y activaciones filtran por el usuario autenticado; el cuerpo de la petición no puede elegir propietario. Las escrituras requieren el origen configurado en `BETTER_AUTH_URL`; las respuestas no se almacenan en caché compartida. Los errores no imprimen parámetros de base de datos ni tokens.

No se necesitan variables ni servicios externos adicionales. La hoja de Google sigue siendo referencia del contenido original; no se consulta ni modifica en ejecución.

## Pruebas

```sh
npm test
npm run typecheck
npm run build
```

Con el servidor local funcionando y `.env.local` configurado:

```sh
npm run test:routines
npm run test:auth
```

`test:routines` crea dos cuentas y sesiones temporales en la base configurada, pasa por la validación real de Better Auth y elimina las cuentas al finalizar. No inicia sesión como ningún usuario real ni incorpora accesos especiales a la aplicación. Solo admite un servidor local; `AUTH_TEST_BASE_URL` permite cambiar el puerto para pruebas aisladas.

Comprueba acceso anónimo, rutina inicial en ambas cuentas, persistencia, edición, validación, rechazo entre cuentas, origen de escritura y activación concurrente. También verifica la restricción de propiedad directamente en PostgreSQL. Las pruebas puras comparan la rutina guardada con la original durante 740 fechas y cubren ciclos de una y tres semanas, límites de fecha y cambios de año.
