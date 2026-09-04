# Manual y Descripción del Sistema de Siniestros

Este documento proporciona una visión general de la plataforma web de gestión de siniestros, detallando sus características principales, los distintos roles de usuario y una guía básica de cómo utilizar cada una de las funcionalidades disponibles.

---

## 1. Visión General del Sistema
El sistema es una aplicación web moderna diseñada para la importación, visualización, análisis y gestión de la accidentabilidad (siniestros laborales y enfermedades profesionales) de los trabajadores. Permite consolidar datos de planillas Excel, calcular KPIs críticos y presentar la información en paneles estadísticos interactivos.

**Arquitectura Técnica:**
* **Frontend y Backend:** Desarrollado íntegramente con [Next.js](https://nextjs.org/) (App Router).
* **Base de Datos:** PostgreSQL alojada en la nube mediante [Neon](https://neon.tech/), gestionada a través de Prisma ORM.
* **Infraestructura:** Desplegado de forma serverless en [Vercel](https://vercel.com/) para alta disponibilidad y escalabilidad.

---

## 2. Roles y Accesos

El sistema cuenta con un sistema de autenticación seguro y gestión de accesos basado en roles:

* **Administrador (`ADMIN`):** 
  * Tiene acceso total al sistema.
  * Puede visualizar los datos y estadísticas de *todos* los establecimientos y sectores.
  * Es el único con permisos para importar archivos Excel, procesar la data y gestionar las cuentas de usuario.
* **Usuario Regular (`USER`):** 
  * Acceso restringido únicamente a los establecimientos que el administrador le haya asignado explícitamente.
  * Al ingresar, los filtros y la visualización de datos se limitan automáticamente a su jurisdicción, garantizando la confidencialidad de la información de otras unidades.

---

## 3. Funcionalidades Principales y Forma de Uso

La plataforma se divide en varias pantallas o módulos principales accesibles desde el menú lateral:

### A. Dashboard / Datos Cargados
Esta es la vista principal donde se consolida la información base de los siniestros importados.
* **Funcionalidad:** Muestra una tabla detallada con todos los registros (fecha, tipo de siniestro, rut, nombre, diagnóstico, días perdidos, etc.).
* **Filtros:** Permite filtrar la matriz por Mes, Año, Tipo de Siniestro (Ej. Accidente de Trabajo, de Trayecto, etc.) y Establecimiento.
* **Exportación:** Incluye un botón para descargar la vista actual filtrada nuevamente a formato Excel.
* **Procesar Data (Solo Admin):** Un botón crucial que se utiliza después de subir nuevos datos para actualizar y recalcular las tablas de resúmenes internos.

### B. Accidentabilidad (KPIs)
Pantalla enfocada en los Indicadores Clave de Rendimiento (KPIs) de seguridad laboral.
* **Funcionalidad:** Muestra tarjetas dinámicas con los indicadores principales: **Frecuencia, Gravedad, Accidentabilidad y Siniestralidad**.
* **Visualización Inteligente:** 
  * Si se observa la vista general (sin filtrar por mes), muestra los KPIs totales.
  * Al **filtrar por un mes específico**, el sistema muestra dos filas de información:
    1. **Mensual:** Los KPIs calculados exclusiva y aisladamente para ese mes.
    2. **Acumulada:** Los KPIs calculados desde enero hasta el mes seleccionado inclusive.
* **Exportación Avanzada:** Al descargar el Excel desde esta vista, se genera un archivo que incluye no solo la data filtrada, sino también una hoja separada con el reporte de los KPIs calculados.

### C. Estadísticas y Gráficos
Módulo de análisis visual y reportes directivos.
* **Gráficos Interactivos:** Muestra gráficos (barras, líneas, etc.) de las tendencias de siniestros a lo largo de los meses. Al hacer clic en los gráficos pequeños, se amplían para un análisis más detallado.
* **Matriz Ordenada:** Incluye una tabla inferior de resumen donde se listan los establecimientos agrupados alfabéticamente primero por **Sector** y luego por **Unidad**, mostrando el total de trabajadores y el desglose de accidentes por mes.

### D. Importar Data (Solo Admin)
* **Funcionalidad:** Permite actualizar la base de datos arrastrando y soltando un archivo Excel oficial.
* **Forma de uso:** El administrador sube la planilla, el sistema la procesa, añade los registros nuevos de forma acumulativa y luego se debe usar el botón "Procesar Data" (en el Dashboard) para que las estadísticas y KPIs reflejen la información recién ingresada.

### E. Administración (Solo Admin)
Panel de control para la gestión del personal.
* **Funcionalidad:** Permite listar, crear, editar y eliminar usuarios.
* **Control de Acceso:** Al crear o editar un usuario, el administrador puede seleccionar mediante una lista de casillas (checkboxes) a qué establecimientos específicos tendrá acceso dicho usuario.
* **Seguridad:** Permite al administrador resetear rápidamente la contraseña de cualquier persona que haya perdido su acceso.

---

## 4. Flujo de Trabajo Típico (Ejemplo)

1. **Carga Mensual:** El Administrador ingresa al sistema, va a "Importar Data" y sube el Excel del mes.
2. **Actualización:** Luego va al "Dashboard" y hace clic en "Procesar Data" para consolidar la información.
3. **Análisis Directivo:** Los gerentes ingresan a "Estadísticas" para ver de forma visual si la tendencia de accidentes del último mes subió o bajó, analizando la matriz por sector.
4. **Reportes Operativos:** Los prevencionistas ingresan a "Accidentabilidad", filtran por el último mes cerrado, observan las tarjetas de KPIs acumulados, y presionan "Descargar Excel" para armar su informe o presentación gerencial.
5. **Autonomía Local:** Los jefes de los establecimientos inician sesión (como USER) y el sistema automáticamente les muestra y les permite exportar *únicamente* la matriz y los KPIs de las unidades que ellos dirigen.
