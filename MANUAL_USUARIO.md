# Manual de Usuario - Portal de Siniestros

Bienvenido al Portal de Siniestros. Este sistema te permitirá visualizar y analizar los Indicadores Clave de Rendimiento (KPIs) de seguridad y salud ocupacional, correspondientes **exclusivamente a los establecimientos que tienes a cargo**.

A continuación, te explicamos paso a paso cómo ingresar y utilizar la plataforma.

---

## 1. Primer Ingreso y Cambio de Contraseña

Por motivos de seguridad, la primera vez que ingreses al sistema con las credenciales entregadas por el Administrador, el sistema te solicitará cambiar tu contraseña.

**Paso a paso:**
1. Ingresa a la dirección web del portal desde tu navegador.
2. Verás la pantalla de **Inicio de Sesión (Login)**. Ingresa tu **Nombre de Usuario** (tu RUT o correo, según lo que te haya indicado el Administrador) y la **Contraseña temporal**.
3. Haz clic en el botón para **Iniciar Sesión**.
4. El sistema detectará que es tu primer ingreso y te redirigirá automáticamente a la pantalla de **Cambio de Contraseña**.
5. En esta pantalla deberás ingresar:
   - Tu **Contraseña actual** (la temporal).
   - Tu **Nueva contraseña** (una que recuerdes fácilmente).
   - **Confirmar tu nueva contraseña** (escribirla exactamente igual).
6. Haz clic en **Cambiar Contraseña**. Si todo está correcto, el sistema te dará la bienvenida a la pantalla principal de Accidentabilidad. 

> [!NOTE]
> De ahora en adelante, siempre ingresarás con tu Nueva Contraseña. Si llegas a olvidarla, deberás contactar al Administrador del sistema para que la restablezca.

---

## 2. Uso de la Pantalla de Accidentabilidad

Como usuario, tu pantalla principal es el módulo de **Accidentabilidad**. Aquí podrás ver el resumen estadístico y el detalle de los siniestros de tus establecimientos asignados.

### A. Los Filtros de Búsqueda
En la parte superior de la pantalla, encontrarás un panel gris con varios filtros que te permitirán segmentar la información:

* **Mes:** Por defecto dice "Todos". Si lo despliegas, puedes seleccionar un mes específico (ej. "Junio"). Al hacerlo, las estadísticas y la tabla de datos de abajo se actualizarán para mostrar **solo lo ocurrido en ese mes**.
* **Año:** Siempre mostrará el año en curso por defecto (ej. 2026). Puedes cambiarlo para ver datos históricos si están disponibles.
* **Tipo Siniestro:** Te permite filtrar la tabla inferior si solo quieres revisar, por ejemplo, "Accidentes de Trabajo", "Accidentes de Trayecto" o "Enfermedades Profesionales".
* **Mis Establecimientos:** Si tienes a cargo más de un establecimiento, aquí podrás seleccionar uno en particular. Si lo dejas en "Todos mis establecimientos", verás la suma de la información de todos ellos. Si solo tienes uno a cargo, el sistema solo te mostrará ese automáticamente.

### B. Tarjetas de Indicadores (KPIs)
Justo debajo de los filtros, verás unas tarjetas de colores con los resultados matemáticos de tu gestión. Estas tarjetas cambian dinámicamente según el filtro de **Mes** que hayas aplicado.

**Si NO has filtrado por Mes (opción "Todos"):**
Verás una sola fila de tarjetas con los indicadores totales de todo el año para:
- **FRECUENCIA**
- **GRAVEDAD**
- **ACCIDENTABILIDAD**
- **SINIESTRALIDAD**
- **TRABAJADORES (Total)**: El número total de trabajadores bajo tu jurisdicción.

**Si seleccionas un Mes específico (ej. Junio):**
El sistema se vuelve más detallado y te mostrará **dos filas de tarjetas**:
1. **Fila Mensual (Ej. FRECUENCIA MENSUAL):** Te muestra el resultado de los indicadores calculados con los accidentes que ocurrieron *exclusivamente en el mes de Junio*.
2. **Fila Acumulada (Ej. FRECUENCIA ACUMULADA):** Te muestra el resultado de los indicadores sumando todos los meses desde Enero *hasta Junio (incluido)*. Esto es ideal para ver cómo va tu gestión en lo que va del año.

### C. La Matriz de Datos
En la parte inferior de la pantalla, verás una gran tabla. Esta tabla contiene el detalle individual de cada accidente, paciente y diagnóstico que componen los números de las tarjetas de arriba.
- Si aplicas un filtro (por ejemplo, seleccionas un Establecimiento), esta tabla ocultará automáticamente a las demás personas y te mostrará solo el detalle de los pacientes de ese lugar.

### D. Descargar Reporte a Excel
En la esquina superior derecha de la pantalla, verás un botón verde llamado **"Descargar Excel"**. 

1. Filtra la pantalla según lo que necesites (ej. selecciona el Mes "Mayo" y un "Establecimiento" específico).
2. Haz clic en **Descargar Excel**.
3. El sistema generará un archivo que contiene:
   - Una hoja con la **tabla de datos de todos los pacientes** que estabas viendo en pantalla.
   - Si filtraste por mes, incluirá una hoja adicional llamada **"KPIs"** que contendrá los resultados exactos de Frecuencia, Gravedad, etc., listos para que los copies y pegues en un informe o presentación.
