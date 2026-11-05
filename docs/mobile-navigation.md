# Navegación y semana en celular

Se conserva la paleta salvia, lavanda y coral, las fuentes DM Sans y Barlow Condensed y los temas del sistema. Hasta 700 px, las pantallas autenticadas muestran una barra inferior con cuatro accesos: Mi semana, Mis rutinas, Mi cuerpo y Perfil. Perfil abre Configuración; Crear rutina sigue disponible dentro de Mis rutinas. A partir de 701 px se mantiene la navegación del encabezado.

La barra tiene iconos de línea, etiquetas visibles y un indicador coral para el destino activo. Los subdirectorios de rutinas conservan Mis rutinas como destino seleccionado. Se reserva espacio al final de la página y al desplazar el foco; las zonas seguras del dispositivo se respetan para que la barra no cubra contenido ni el indicador de inicio del teléfono. El encabezado se oculta en celular, incluido el acceso público.

La semana mantiene los siete días, de lunes a domingo. En celular son tarjetas de ancho fijo en una sola fila con desplazamiento horizontal nativo y ajuste al centro. Queda parte de las tarjetas contiguas visible como indicación del desplazamiento. Se elimina el tratamiento especial que hacía que el domingo ocupara una fila completa. En tablet y escritorio se conserva la distribución de siete columnas.

Al abrir la semana se muestra seleccionado y visible el día actual de Bogotá. Un cambio de día o de tamaño de pantalla vuelve a colocar la selección a la vista, sin cambiar el desplazamiento vertical de la página. Deslizar manualmente no modifica el entrenamiento elegido. Las actualizaciones periódicas de los datos no reinician el desplazamiento si siguen siendo el mismo día y selección. Las flechas, Inicio y Fin siguen funcionando con el teclado.

El menú lateral abierto se cierra al entrar al tamaño de celular para que su capa no bloquee la barra inferior. Las rutas mantienen sus comprobaciones de sesión en el servidor; la navegación no autentica al usuario ni guarda sesiones o preferencias nuevas.

El indicador flotante de desarrollo de Next se desactiva mediante su opción oficial: su posición predeterminada tapaba la primera pestaña de la barra. Esto no desactiva los avisos de errores de la aplicación.

## Verificación

Se comprueba en navegador a 320, 360, 390, 560 y 700 px, y se conserva la navegación de tablet/escritorio a 701, 834 y 1440 px. Las comprobaciones cubren los cuatro destinos, el estado activo al crear una rutina, espacio inferior libre para las acciones, cambio de tema desde Perfil, ajuste al día actual, cambio de fecha y semana, persistencia de un desplazamiento manual durante una actualización, teclado y cierre de un menú lateral abierto al reducir la pantalla. Se usan ambos temas y la preferencia de movimiento reducido.

Las pruebas de rutina mantienen los siete días y la fecha de Bogotá. La autenticación y las rutas protegidas se verifican contra el servidor local; las comprobaciones de navegador usan una cuenta temporal y eliminan sus datos al terminar. No se añade ninguna configuración externa.
