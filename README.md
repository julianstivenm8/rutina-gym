# Mi rutina · Fuerza + cardio

Aplicación en Next.js App Router, React y TypeScript, con acceso mediante Google, inspirada en la referencia compartida: marfil, verde salvia, lavanda, coral, tipografía condensada e iconos de línea.

## Desarrollo

```sh
npm install
npm run dev
```

Abrir http://localhost:3000, el mismo origen configurado en `BETTER_AUTH_URL` y en el callback de Google.

```sh
npm test
npm run typecheck
npm run build
```

La autenticación requiere un servidor Next.js, PostgreSQL en Neon y un cliente OAuth de Google. Las fuentes se sirven localmente con `next/font/local`. Consultar [la configuración de autenticación](docs/authentication.md) para instalar las dependencias, completar `.env.local`, generar y aplicar las migraciones, y registrar el callback de Google.

El stack acordado para los agentes del proyecto está en [AGENTS.md](AGENTS.md): Next.js, shadcn/ui, Tailwind, React Hook Form, Zod, Zustand, Sanity, Resend, Better Auth, Drizzle ORM y Neon. Las herramientas se incorporan conforme las funcionalidades las necesitan.

## Comportamiento

- Solo muestra la semana actual, de lunes a domingo.
- La fecha se calcula con `Intl.DateTimeFormat` en `America/Bogota`, independientemente de la zona del dispositivo.
- La rutina original es la predeterminada para todas las cuentas: semana ISO par, rutina 1; impar, rutina 2.
- El menú lateral permite crear, editar y activar rutinas propias. Solo hay una activa por cuenta. Los ciclos personalizados alternan de 1 a 12 semanas; consultar [Rutinas por cuenta](docs/routines.md).
- La semana 53 seguida de la semana 1 repite la rutina 2.
- Actualiza el día y la semana al volver a la pestaña y cada 30 segundos mientras está abierta.
- El día actual siempre conserva color coral, subrayado y la etiqueta «Hoy», aunque se seleccione otro.
- Cada día es un botón con estado seleccionado y nombre accesible. Admite Tab, Enter, Espacio, flechas izquierda/derecha, Inicio y Fin.
- En celular, seleccionar un día desplaza al detalle; «Cambiar día» vuelve al calendario.
- El acceso con Google y las sesiones se gestionan con Better Auth y Neon. La rutina requiere una sesión válida comprobada en el servidor.
- Los pesos opcionales por ejercicio se guardan en Neon con su unidad y fecha; el detalle permite ver su evolución. Consultar [Pesos por ejercicio](docs/weights.md).
- «Mi cuerpo» guarda medidas corporales privadas por fecha, con figuras interactivas de hombre y mujer, datos opcionales, IMC calculado e historial con borrado. Consultar [Mi cuerpo](docs/body.md).
- «Configuración», al pie del menú, permite elegir la apariencia, consultar y cerrar sesiones y eliminar la cuenta con confirmación. Consultar [Configuración de la cuenta](docs/settings.md).
- No utiliza localStorage, sessionStorage ni IndexedDB.

La primera vista tiene un estado breve de carga para calcular la fecha real en el navegador, evitando congelar la semana en la fecha de compilación o causar diferencias de hidratación. La fecha se obtiene del reloj del dispositivo.

## Tema claro y oscuro

La aplicación usa el tema del sistema al abrirse y sigue sus cambios hasta que se elige un modo con el botón del header. El botón de luna/sol permite alternar entre claro y oscuro y comunica su estado con `aria-pressed`. La elección se mantiene mientras la página está abierta; al recargar vuelve a seguir al sistema.

Toda la paleta se define con `light-dark()` en el tema de Tailwind, incluidos calendario, selección de días, ejercicios, HIIT y descanso. `color-scheme` aplica el tema del sistema desde la primera pintura y adapta también los controles y las barras de desplazamiento del navegador. No se necesita almacenamiento del navegador ni dependencias adicionales. Los temas requieren un navegador moderno compatible con `light-dark()`.

## Contenido

Cada día de fuerza muestra los ejercicios de la hoja [Rutinas Fuerza cardio](https://docs.google.com/spreadsheets/d/1lP5NMDguqA2cdb6-dmA4f_YqYxcTGslWgUUKwgSJt5s/edit?usp=drivesdk), conservando sus nombres, anotaciones y orden. Las listas dependen de la rutina y del día: la rutina 1 tiene nueve ejercicios por sesión; en la rutina 2, lunes y viernes tienen siete ejercicios distintos y el miércoles mantiene nueve. La plantilla original está en `src/lib/routine.ts` y se copia a Neon para cada cuenta. El inicio utiliza la rutina activa guardada; la aplicación no consulta Google Drive.

Se muestran los nombres y las anotaciones de series indicadas expresamente en la hoja: el miércoles de la rutina 1 incluye «2 Series» en peso muerto unilateral, step ups y curl nordico. No se añaden repeticiones, pesos, duración de fuerza ni pulsaciones objetivo. Cardio zona 2: 45–60 minutos. HIIT: cuatro intervalos de cuatro minutos intensos y tres recuperaciones de 3–4 minutos entre ellos. Domingo: descanso.

## Validación

Las pruebas cubren ambas rutinas, la transición a lunes a las 05:00 UTC, semanas ISO en el cambio de año, semana 53 → 1, meses y ausencia de ancla en octubre. También verifican la configuración de autenticación, los orígenes permitidos y la ausencia de secretos en los errores de configuración.

El calendario tuvo una revisión visual y de selección de los siete días a 390 px y 834 px. Google OAuth está configurado en el entorno local. Las pruebas de rutinas verifican persistencia y aislamiento con cuentas temporales en Neon; el editor también se comprobó en navegador en escritorio, celular y ambos temas. Ver `docs/routines.md` para repetir las comprobaciones.

## Estilos con Tailwind CSS

Tailwind CSS 4 se integra mediante `@tailwindcss/postcss` en `postcss.config.mjs`. Los colores y las fuentes del prototipo están disponibles como utilidades: `bg-paper`, `text-ink`, `text-sage`, `bg-sage-dark`, `font-sans` y `font-heading`.

Los estilos de los componentes, los estados de selección, las variantes de color y las adaptaciones responsive se definen con utilidades de Tailwind en `weekly-routine.tsx`, `week-calendar.tsx`, `session-detail.tsx` y `routine-cycle.tsx`. Las clases condicionales usan `cn` (`clsx` + `tailwind-merge`) y nombres completos que Tailwind puede detectar.

`src/app/globals.css` contiene únicamente el tema, la animación de detalle, las variantes responsive y el reset global original sin Preflight. Las variantes `compact` (hasta 1150 px), `touch` (hasta 900 px), `tablet` (701–900 px), `mobile` (hasta 700 px), `small` (hasta 359 px) y `wide` (desde 1441 px) conservan los rangos del diseño. La detección de clases se limita a `src/`.
