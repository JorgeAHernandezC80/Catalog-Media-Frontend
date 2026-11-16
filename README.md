# 🎬 Catalog-Media-Frontend

Interfaz web para administrar el catálogo de producciones audiovisuales (Películas y Series) que expone la API [Catalog-Media-API_REST](https://github.com/JorgeAHernandezC80/Catalog-Media-API_REST). Permite listar, crear, editar y eliminar registros de los cinco módulos del sistema desde el navegador. Además, hace visibles en pantalla las reglas de negocio que valida el backend.

Desarrollado para el curso **Proyecto Integrado II - Desarrollo de Aplicaciones Web** en la **Institución Universitaria Digital de Antioquia (IU Digital)**, como parte de la evidencia **EA2**.

---

## 📋 Índice

1. [Descripción General & Propósito](#1-descripción-general--propósito)
2. [Arquitectura del Proyecto (Capas del Frontend)](#2-arquitectura-del-proyecto-capas-del-frontend)
3. [Reglas de Negocio en Pantalla](#3-reglas-de-negocio-en-pantalla)
4. [Instalación y Levantamiento Rápido](#4-instalación-y-levantamiento-rápido)
5. [Módulos del Catálogo (Pantallas 1 al 6)](#5-módulos-del-catálogo-pantallas-1-al-6)
6. [Despliegue en Netlify](#6-despliegue-en-netlify)
7. [Estructura de Archivos](#7-estructura-de-archivos)
8. [Buenas Prácticas Aplicadas](#8-buenas-prácticas-aplicadas)
9. [Autores y Créditos](#9-autores-y-créditos)
10. [Licencia y Derechos de Autor](#10-licencia-y-derechos-de-autor)

---

## 1. Descripción General & Propósito

Este proyecto es la capa visual del catálogo multimedia. Con él no hace falta usar Postman para trabajar con la API: los géneros, directores, productoras, tipos y producciones se administran desde formularios y tablas en el navegador.

**Lo más importante en 90 segundos:** El frontend está hecho con **HTML semántico, CSS y JavaScript puro**, sin frameworks ni dependencias. No hay `npm install` ni paso de compilación, son archivos estáticos. Un solo motor genérico (`crud.js`) maneja el listar, crear, editar y eliminar de las cinco pantallas, y cada módulo solo declara sus campos y columnas. Toda la comunicación con el backend pasa por una única capa (`api.js`). Así los errores de red y de la API se manejan en un solo lugar.

> **Nota:** El uso de HTML semántico en lugar de ReactJS fue autorizado por el docente para esta evidencia.

---

## 2. Arquitectura del Proyecto (Capas del Frontend)

El proyecto separa responsabilidades en capas, de forma parecida al patrón MVC del backend:

* **Páginas `.html`**: La estructura (vista) de cada módulo, con etiquetas semánticas y formularios accesibles.
* **`css/estilos.css`**: Estilos propios con variables CSS, grid, modo oscuro y tabla responsive.
* **`css/cartelera.css`**: Estilos de la cartelera (portada pública). Usa las fuentes Cormorant Garamond y Jost (Google Fonts).
* **`css/gestion.css`**: Tema de las cinco pantallas de gestión, para que se vean como la cartelera (azul noche, marfil y dorado solo en el botón principal). Se carga después de `estilos.css` y solo cambia la apariencia.
* **`js/config.js`**: Dirección de la API y máximo de géneros por producción, en un solo lugar.
* **`js/api.js`**: Única capa que usa `fetch`. Unifica los tres formatos de error del backend.
* **`js/crud.js`**: Motor genérico de listar, crear, editar y eliminar.
* **`js/ui.js`**: Utilidades de interfaz (mensajes, diálogo de confirmación, fechas e insignias de estado).
* **`js/<modulo>.js`**: Configuración de cada pantalla (campos, columnas y listas desplegables).

> **Nota:** El proyecto usa **ES Modules** (`<script type="module">` con `import`/`export`), igual que el backend.

---

## 3. Reglas de Negocio en Pantalla

El backend valida las reglas. El frontend las hace visibles y evita los errores más comunes antes de enviar los datos:

* **Varios Géneros:** Una producción lleva de **1 a 5 géneros distintos**. El selector bloquea el sexto y no deja guardar si no hay ninguno marcado.
* **Solo Referencias Activas:** Director, Productoras y Géneros deben estar en estado `Activo` para asignarlos, por eso los `Inactivo` no aparecen en las listas. Si al editar una producción ya tenía uno inactivo, se muestra marcado como *(Inactivo)*.
* **Identificación Única:** Si el `serial` o la `url` ya existen, se muestra el mensaje del backend (`409 Conflict`).
* **Sin Registros Huérfanos:** Si se intenta eliminar un registro que está en uso por alguna producción, se muestra el aviso del backend (`409 Conflict`).
* **Confirmación al Eliminar:** Antes de borrar se abre un diálogo de confirmación (`<dialog>`).
* **Filtro por Género:** La pantalla de Media permite ver solo las producciones de un género (`?genero=<id>`).

---

## 4. Instalación y Levantamiento Rápido

Sigue estos pasos para clonar e iniciar el proyecto localmente:

### a. Clonar el repositorio

```bash
git clone https://github.com/JorgeAHernandezC80/Catalog-Media-Frontend.git
cd Catalog-Media-Frontend
```

### b. Encender el backend
En otra terminal, dentro del repositorio de la API:
```bash
npm run dev
```
Por defecto queda escuchando en `http://localhost:5000`. El backend ya tiene CORS habilitado (`app.use(cors())`), así que el frontend puede correr en otro puerto sin problema.

### c. Configurar la dirección de la API
La dirección está en `js/config.js` y se elige sola según dónde se abra la página. No hay que cambiarla a mano:
```js
const API_LOCAL = 'http://localhost:5000/api/v1';                          // en tu PC (Live Server)
const API_PUBLICA = 'https://catalog-media-api-rest.onrender.com/api/v1';  // publicada en Netlify
```
Si la página se abre en `localhost` o `127.0.0.1`, usa el backend local. En cualquier otro dominio usa el backend publicado en Render. Ninguna de las dos direcciones lleva `/` al final.

### d. Abrir el frontend con un servidor local
Con la extensión **Live Server** de VS Code: clic derecho en `index.html` → *Open with Live Server*. Se abrirá en:
```
http://127.0.0.1:5500/index.html
```

> **Importante:** No abras los `.html` con doble clic (`file://`). El navegador bloquea los módulos de JavaScript (`type="module"`) desde ese origen, por eso necesitan un servidor local. Tampoco lo abras en el puerto 5000, porque ese puerto es el de la API.

Si la Cartelera muestra las producciones (o el aviso de que aún no hay ninguna) y las cifras del escenario tienen números, el frontend ya está conectado con la API.

---

## 5. Módulos del Catálogo (Pantallas 1 al 6)

La interfaz tiene una cartelera de inicio y cinco módulos con la misma secuencia de operaciones CRUD:

| Secuencia | Página | Módulo | Detalle |
| :--- | :--- | :--- | :--- |
| **1** | `index.html` | Cartelera | Portada pública al estilo de un sitio de cine: película destacada con póster y una claqueta (con sus datos), bobinas y latas de película dibujadas en SVG; grilla de pósters con búsqueda, filtros por tipo y género y ficha de detalle. Las pantallas de gestión se abren desde el enlace «Gestionar» del pie |
| **2** | `generos.html` | Géneros | Nombre, estado (Activo/Inactivo) y descripción |
| **3** | `directores.html` | Directores | El campo se llama `nombres`, como en el modelo |
| **4** | `productoras.html` | Productoras | Nombre, estado, eslogan y descripción |
| **5** | `tipos.html` | Tipos | Película, Serie… (no maneja estado) |
| **6** | `media.html` | Media | Producciones con selector de 1 a 5 géneros y filtro por género |

Cada módulo usa estos endpoints de la API:

| Acción en pantalla | Método HTTP | Endpoint |
| :--- | :--- | :--- |
| Cargar la tabla | `GET` | `/api/v1/<modulo>` |
| Botón **Crear** | `POST` | `/api/v1/<modulo>` |
| Botón **Guardar cambios** | `PUT` | `/api/v1/<modulo>/:id` |
| Botón **Eliminar** | `DELETE` | `/api/v1/<modulo>/:id` |

**Ejemplo del cuerpo que envía el formulario de Media (`POST /api/v1/media`):**

Los campos `generos` y `productoras` se arman con las casillas marcadas, como listas de IDs (de 1 a 5 cada una, porque una película la pueden hacer varias productoras). Director y Tipo salen de listas desplegables y son un solo valor.
```json
{
  "serial": "PEL-0001",
  "titulo": "Viaje a las estrellas",
  "sinopsis": "Una tripulación explora los límites del universo conocido.",
  "url": "https://catalogo.ejemplo.com/peliculas/viaje-a-las-estrellas",
  "portada": "https://catalogo.ejemplo.com/portadas/viaje-a-las-estrellas.jpg",
  "anoEstreno": 2024,
  "generos": ["<id1>", "<id2>"],
  "director": "<idDirector>",
  "productoras": ["<idProductora1>", "<idProductora2>"],
  "tipo": "<idTipo>"
}
```

**Manejo de errores:** el backend responde con tres formatos distintos (`{ message }`, `{ error }` y `{ message, errores: [...] }`). La capa `api.js` los unifica y la pantalla los muestra en un aviso rojo. Si la API está apagada, aparece este mensaje:
```
No se pudo conectar con la API. Revisa que el servidor esté encendido y que la dirección en js/config.js sea correcta.
```

---

## 6. Despliegue en Netlify

El proyecto está publicado en dos servicios:

| Parte | Servicio | URL |
| :--- | :--- | :--- |
| Frontend | Netlify | https://catalog-mediaapi.netlify.app |
| Backend (API) | Render + MongoDB Atlas | https://catalog-media-api-rest.onrender.com |

El frontend es estático, así que no necesita build:

1. En Netlify: *Add new site → Import an existing project* y elegir este repositorio.
2. Dejar **vacíos** *Build command* y *Publish directory* (o poner `.`).
3. Cada `git push` a la rama `main` vuelve a publicar el sitio automáticamente.

> **Nota:** El backend usa el plan gratuito de Render, que apaga el servidor cuando no recibe visitas. La primera carga después de un rato puede tardar cerca de un minuto; si aparece el aviso de conexión, espera y recarga la página.

---

## 7. Estructura de Archivos

```
Catalog-Media-Frontend/
├── css/
│   ├── estilos.css
│   ├── cartelera.css
│   └── gestion.css
├── js/
│   ├── config.js
│   ├── api.js
│   ├── crud.js
│   ├── ui.js
│   ├── inicio.js
│   ├── generos.js
│   ├── directores.js
│   ├── productoras.js
│   ├── tipos.js
│   └── media.js
├── index.html
├── generos.html
├── directores.html
├── productoras.html
├── tipos.html
├── media.html
└── README.md
```

---

## 8. Buenas Prácticas Aplicadas

* **Nombres de archivos:** minúsculas, un archivo `.html` y un `.js` por módulo (generos.html, generos.js).
* **Nombres de carpetas:** minúsculas (css/, js/).
* **Variables y funciones:** camelCase (iniciarCrud, pintarTabla, mostrarError).
* **Clases:** PascalCase (ErrorApi).
* **Constantes de configuración:** UPPER_SNAKE_CASE (API_URL, MAX_GENEROS).
* **Módulos:** ES Modules (import/export), sin scripts globales.
* **Sin repetición:** un solo motor CRUD para las cinco pantallas.
* **Seguridad:** los datos de la API se pintan con `textContent`/`append`, nunca con `innerHTML`, para evitar XSS. Los enlaces externos usan `rel="noopener noreferrer"`.
* **Accesibilidad:** etiquetas `header`, `nav`, `main`, `section`, `form`, `fieldset`, `legend`, `label`, `table`, `caption` y `dialog`; enlace «Saltar al contenido», `aria-current` en la navegación, mensajes con `role="alert"`/`"status"` y foco visible. El estado se muestra con texto y color, no solo con color.

---

## 9. Autores y Créditos
* **Desarrollador:** Jorge A. Hernandez C.
* **Docente Evaluador:** Federico Henao
* **Institución:** Institución Universitaria Digital de Antioquia (IU Digital)
* **Curso:** Proyecto Integrado II - Desarrollo de Aplicaciones Web
* **Semestre:** Sexto Semestre - PREICA2602B020099
* **Backend relacionado:** [Catalog-Media-API_REST](https://github.com/JorgeAHernandezC80/Catalog-Media-API_REST)

---

## 10. Licencia y Derechos de Autor

Copyright (c) 2026 Jorge A. Hernández C. Todos los derechos reservados. Este software y su código fuente son propiedad de Jorge A. Hernández C. No se concede ningún permiso para usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y/o vender copias de este software, ni para permitir que terceros lo hagan, sin el consentimiento previo y por escrito del autor. Todos los derechos no otorgados expresamente quedan reservados.

Copyright (c) 2026 Jorge A. Hernández C. All rights reserved. This software and its source code are the property of Jorge A. Hernández C. No permission is granted to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software, or to permit persons to whom it is furnished to do so, without the prior written consent of the author. All rights not expressly granted are reserved.

---
### Proyectos Académicos y Uso Institucional
Este repositorio fue creado con fines estrictamente educativos y evaluativos para el curso **Proyecto Integrado II - Desarrollo de Aplicaciones Web** de la **Institución Universitaria Digital de Antioquia (IU Digital)**. Queda autorizado el acceso y revisión del material al docente evaluador **Federico Henao** y a los cuerpos directivos institucionales pertinentes.
