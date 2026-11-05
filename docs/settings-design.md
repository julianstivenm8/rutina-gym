# Configuración

Una página de control personal accesible desde el pie del menú. El nombre y correo permanecen visibles, con un acceso claro a Configuración en esa misma zona.

Paleta del proyecto: papel #f6f5ef, tinta #283d33, salvia #58735f, salvia clara #e9ede4, lavanda #817294 y coral #b45b46, con sus equivalentes oscuros. Barlow Condensed en títulos, DM Sans en textos y controles.

Distribución: título y cuenta al inicio; una guía corta a la izquierda y secciones a la derecha. En celular, una sola columna. La interacción principal son tres vistas previas de apariencia que cambian el tema al instante. Acceso y sesiones se presentan como filas de información, evitando una cuadrícula de tarjetas idénticas. El borrado queda al final, con contraste coral y confirmación específica de la cuenta.

El tema inicial sigue al sistema y la elección manual solo vive en la página abierta, de acuerdo con las convenciones existentes. El selector y el botón del header comparten el mismo estado. Las sesiones son accesos activos de Better Auth, no un historial de entrenamientos ni un registro de actividad.

La eliminación requiere escribir ELIMINAR y el correo de la cuenta. El servidor comprueba ambos datos, la sesión y su antigüedad. Si hace falta verificar Google, se regresa a Configuración sin ejecutar una eliminación automática. Las acciones de sesión y cuenta las realiza Better Auth; la interfaz no recibe tokens de sesión.
