# Pesos opcionales por ejercicio

En el detalle de fuerza, cada ejercicio tiene un campo de peso opcional. Acepta coma o punto y hasta tres decimales, permite kg o lb y solo guarda al pulsar el botón junto al campo. Cero es un valor explícito; un campo vacío no crea un registro.

El campo recupera el último valor guardado. El botón del reloj despliega el registro inicial y los cinco cambios más recientes, con fechas de Colombia. «Ver más» carga otros cinco cada vez, hasta completar el historial. La diferencia respecto al inicio compara ambas cargas en la misma unidad. Los registros anteriores se conservan para las estadísticas futuras, salvo los que el usuario elimine. El contador indica cuántos ejercicios del día tienen una carga registrada.

Cada registro tiene un botón de papelera y una confirmación con el peso que se eliminará. Al confirmar, se borra solo ese registro y se recalculan el inicio, el último peso y la diferencia. Si se borra el último registro disponible, el ejercicio vuelve a quedar sin peso. El borrado no cambia un peso que el usuario tenga todavía como borrador en el campo. Un error de conexión permite reintentar la misma eliminación.

## Identidad y conservación

Los ejercicios guardados tienen un identificador de su cuenta, independiente de su posición en la lista. Reordenar o renombrar una referencia conserva ese identificador. Copiar semanas, días o rutinas conserva las referencias existentes. Los ejercicios añadidos sin identificador se vinculan por su nombre de creación, ignorando mayúsculas y espacios repetidos, dentro de la misma cuenta. Se mantienen separadas las variantes con nombres distintos; no se deducen sinónimos ni se cambian los nombres visibles.

`exercise_track` identifica el ejercicio y mantiene la versión del último cambio. `exercise_weight` conserva cada valor, unidad, fecha del servidor, versión, clave de reintento y nombres de ejercicio y rutina en el momento de guardarlo. La referencia de la rutina se conserva como contexto, de modo que quitar un ejercicio de una rutina no elimina sus registros.

La migración `drizzle/0002_exercise_weights.sql` añade las tablas y asigna identificadores a los ejercicios existentes preservando nombres, anotaciones y orden. No rellena pesos ni inventa registros de entrenamiento.

## Autorización y escrituras

`GET /api/weights?routineId=...`, `POST /api/weights`, `DELETE /api/weights` y `GET /api/weights/history?routineId=...&exerciseId=...&beforeVersion=...` comprueban la sesión con Better Auth. El servidor comprueba tanto la propiedad de la rutina como que el ejercicio forme parte de ella. El borrado restringe además el registro por usuario y ejercicio. Las claves foráneas compuestas impiden asociar registros a ejercicios de otra cuenta. La creación o edición de rutinas también valida que todos sus identificadores de ejercicios pertenezcan al usuario.

Cada cambio verifica la versión que vio el cliente. Una única sentencia SQL incrementa esa versión y añade el registro en una transacción. Una escritura desactualizada responde `409`, devuelve el estado reciente y permite revisar y guardar de nuevo. Los reintentos con la misma clave y el mismo contenido son idempotentes; guardar un valor idéntico no genera otro registro.

El borrado también incrementa la versión y elimina el registro en una única sentencia. Esa versión nunca se reduce ni se reinicia aunque el historial quede vacío, por lo que reintentar un guardado antiguo no resucita registros borrados. El número de registros se cuenta por separado. La paginación usa la versión del último registro cargado como cursor, no posiciones; el resumen y la página se leen en la misma consulta. Si cambia el historial, la interfaz vuelve a mostrar los cinco registros recientes.

Zustand mantiene los pesos sincronizados entre los días de la página y se inicializa por instancia de la rutina. No almacena sesiones, tokens ni datos en almacenamiento del navegador. Los borradores permanecen en el formulario cuando falla el guardado. No se añaden servicios externos ni variables nuevas.

## Verificación

```sh
npm test
npm run test:weights
npm run test:routines
npm run typecheck
npm run build
```

Las pruebas de integración requieren la aplicación local y `.env.local`. Usan cuentas y sesiones temporales comprobadas por Better Auth y eliminan sus datos al terminar. Cubren aislamiento entre cuentas, valores opcionales y decimales, cero explícito, paginación de cinco en cinco, borrado de registros intermedios/iniciales/recientes y del historial completo, reintentos, conflictos simultáneos de borrado y guardado, cambio de unidad y continuidad de la identidad al editar rutinas.
