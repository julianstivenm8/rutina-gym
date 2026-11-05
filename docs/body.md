# Mi cuerpo

`/mi-cuerpo` se abre desde el menú lateral y requiere una sesión válida de Better Auth. La página consulta sus datos en el servidor; las operaciones de `/api/body` vuelven a comprobar la sesión. Todas las respuestas de la API son privadas y sin caché.

## Uso

- El género se elige explícitamente; «Sin especificar» muestra una figura neutral. Hombre y mujer tienen ilustraciones propias. Puede guardarse solo el perfil sin crear medidas ficticias.
- Peso en kg y altura en cm. Contornos en cm: cuello, hombros, pecho, cintura, cadera, brazo, antebrazo, muslo y pantorrilla. Las extremidades tienen lado izquierdo y derecho propios.
- Tocar un punto selecciona la zona y lleva al campo. Los campos también pueden recorrerse con teclado; no es obligatorio usar el mapa.
- Cada registro incluye solo las medidas escritas, acepta coma o punto y hasta tres decimales. Al guardar se limpian todos los campos, incluidos los de grupos ocultos. Un campo vacío no repite una medida anterior.
- La fecha corresponde al día de las medidas. El día actual se calcula en `America/Bogota`. Se aceptan fechas anteriores, incluidas correcciones de registros; no se aceptan fechas futuras ni fechas inexistentes.
- El resumen muestra la última medida disponible de cada campo con su fecha. Añadir solo una cintura no actualiza la fecha del peso. La comparación con la medida anterior es neutral y respeta el orden de las fechas, con desempate por creación del registro.
- El historial muestra cinco registros al principio y permite cargar otros cinco. Un registro puede abrirse para ver su detalle o eliminarse con confirmación. El borrado recalcula las últimas medidas y sus diferencias; el perfil se conserva.

El IMC se calcula como `pesoKg * 10000 / alturaCm²`, usando el último peso y altura disponibles. Sus fechas siguen visibles. Se muestra a un decimal, con mayor precisión si el redondeo cruzaría un límite de categoría. El indicador presenta bajo peso (<18,5), peso normal (18,5 a <25), sobrepeso (25 a <30) u obesidad (≥30), con una escala visual. La clasificación usa el valor sin redondear. Es una referencia para adultos de 20 años o más, igual para hombres y mujeres; no depende del género elegido para la figura. No se asume una edad ni se añaden categorías pediátricas: menores de 20 años requieren otra interpretación por edad y sexo. No se establecen metas ni se estima grasa o masa muscular. Fuente: [categorías de IMC para adultos del CDC](https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html).

## Datos y protección

La migración versionada `0003_body_measurements.sql` añade tres tablas sin alterar datos existentes:

- `body_profile`: género elegido y versión de cambios por cuenta.
- `body_record`: identificador, cuenta, clave de reintento, fecha de medición, género del registro y fecha de creación del servidor.
- `body_measurement`: campo y valor decimal. Una clave foránea compuesta impide asociarlo a un registro de otra cuenta; las restricciones de base de datos validan campos y rangos.

Los límites de entrada son mayores que cero y hasta 600 kg o 300 cm, con tres decimales como máximo. No son metas ni rangos clínicos. El género no interviene en el cálculo matemático del IMC.

Un guardado confirma la versión del perfil, crea el registro y añade sus medidas en una sola sentencia SQL. Los reintentos conservan la misma clave para evitar duplicados. Una solicitud desactualizada devuelve `409` y el estado actual, conservando el borrador para revisarlo. Borrar también incrementa la versión, sin reiniciarla aunque se elimine todo el historial. Los cambios comprueban el origen de la solicitud. El cliente mantiene el estado en un proveedor de Zustand por página y no utiliza almacenamiento del navegador.

Las ilustraciones se sirven como WebP locales con transparencia. Sus fuentes y prompts se documentan en [body-design.md](body-design.md) y [body-illustrations.json](body-illustrations.json). No hay claves, variables de entorno, suscripciones ni servicios externos nuevos en ejecución.

## Verificación

```sh
npm test
npm run test:body
npm run test:auth
npm run test:routines
npm run test:weights
npm run build
```

Las pruebas de integración usan cuentas temporales y sesiones verificadas por Better Auth contra la aplicación local y Neon, y eliminan sus datos al terminar. Comprueban autenticación y orígenes reales, aislamiento por cuenta, permisos de la base de datos, registros parciales, fechas, género independiente, reintentos, paginación, conflictos concurrentes, borrado y recálculo. No se añade un acceso alternativo de autenticación en producción.
