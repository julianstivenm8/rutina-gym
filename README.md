# Mi rutina · Fuerza + cardio

Prototipo en Next.js App Router, React y TypeScript, inspirado en la referencia compartida: marfil, verde salvia, lavanda, coral, tipografía condensada e iconos de línea.

## Desarrollo

```sh
npm install
npm run dev
```

Abrir http://127.0.0.1:3000.

```sh
npm test
npm run typecheck
npm run build
```

La compilación exporta la aplicación estática a `out/`. No requiere un servidor de aplicación ni servicios externos. Las fuentes se sirven localmente con `next/font/local`.

## Comportamiento

- Solo muestra la semana actual, de lunes a domingo.
- La fecha se calcula con `Intl.DateTimeFormat` en `America/Bogota`, independientemente de la zona del dispositivo.
- Semana ISO par: rutina 1. Semana ISO impar: rutina 2.
- La semana 53 seguida de la semana 1 repite la rutina 2.
- Actualiza el día y la semana al volver a la pestaña y cada 30 segundos mientras está abierta.
- El día actual siempre conserva color coral, subrayado y la etiqueta «Hoy», aunque se seleccione otro.
- Cada día es un botón con estado seleccionado y nombre accesible. Admite Tab, Enter, Espacio, flechas izquierda/derecha, Inicio y Fin.
- En celular, seleccionar un día desplaza al detalle; «Cambiar día» vuelve al calendario.
- No utiliza base de datos, cuentas, cookies de aplicación, localStorage, sessionStorage, IndexedDB, historial de actividad ni seguimiento de entrenamientos.

La primera vista tiene un estado breve de carga para calcular la fecha real en el navegador, evitando congelar la semana en la fecha de compilación o causar diferencias de hidratación. La fecha se obtiene del reloj del dispositivo.

## Contenido

La fuerza solo define tren superior/inferior. No se agregaron ejercicios concretos, series, repeticiones, duración de fuerza ni pulsaciones objetivo. Cardio zona 2: 45–60 minutos. HIIT: cuatro intervalos de cuatro minutos intensos y tres recuperaciones de 3–4 minutos entre ellos. Domingo: descanso.

## Validación

Las pruebas cubren ambas rutinas, la transición a lunes a las 05:00 UTC, semanas ISO en el cambio de año, semana 53 → 1, meses y ausencia de ancla en octubre. Revisión visual y de selección de los siete días en navegador a 390 px y 834 px, con navegación de teclado y sin errores de consola.
