# Mi cuerpo

Una libreta corporal con un mapa interactivo como centro de la página. La figura es ilustrativa: no estima la apariencia, composición corporal ni el estado de salud a partir de las medidas.

Paleta existente: papel #f6f5ef, tinta #283d33, salvia #58735f, salvia clara #e9ede4, lavanda #817294 y coral #b45b46; se conservan sus equivalentes oscuros. Barlow Condensed para títulos y cifras de referencia, DM Sans para formularios y lectura.

Distribución: encabezado alineado a la izquierda; banda de peso, altura e IMC; mapa corporal amplio a la izquierda y cuaderno de medidas a la derecha. En celular, el mapa precede al editor; tocar una zona lleva al campo correspondiente. El formulario agrupa datos generales, tronco, brazos y piernas para evitar una lista interminable. Solo se registran valores escritos explícitamente. Debajo aparece el historial por fecha con detalle y borrado confirmado.

La figura y sus puntos constituyen el gesto visual principal. Se evitan gráficas vacías, objetivos inventados, puntuaciones de salud y tarjetas repetidas para cada centímetro. Cada medida guardada muestra su propia fecha y una diferencia neutral respecto a la anterior. El género controla la ilustración; se ofrece «Sin especificar» y una representación neutral al inicio. El IMC añade una etiqueta y escala de referencia para adultos (20+), con los mismos rangos para hombres y mujeres.

Las ilustraciones se generaron con la herramienta integrada de imágenes, con fondo transparente, y se optimizaron a WebP sin modificar su contenido. Archivos: `public/images/body/male.webp` y `public/images/body/female.webp`. Los prompts completos se conservan en `body-illustrations.json`.

IMC: peso en kg dividido por altura en metros al cuadrado. La categoría se calcula sin redondear y no se presenta como diagnóstico. Fuente: https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html
