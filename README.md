# Catálogo de Media — Frontend

Frontend de la evidencia **EA2 · Proyecto Integrado II (IU Digital)**. Consume la API REST del proyecto
[Catalog-Media-API_REST](https://github.com/JorgeAHernandezC80/Catalog-Media-API_REST).

Está hecho con **HTML semántico, CSS y JavaScript puro**, sin frameworks ni dependencias: no hay `npm install`
ni paso de compilación. Son archivos estáticos que cualquier navegador abre directamente.

## ¿Qué permite hacer?

Cinco módulos, cada uno con **listar, crear, editar y eliminar**:

| Página | Módulo | Notas |
|---|---|---|
| `index.html` | Inicio | Muestra cuántos registros hay en cada módulo y comprueba la conexión con la API |
| `generos.html` | Géneros | Estado Activo/Inactivo y descripción |
| `directores.html` | Directores | El campo se llama `nombres` (así está en el modelo) |
| `productoras.html` | Productoras | Estado, eslogan y descripción |
| `tipos.html` | Tipos | Película, serie… (no tiene estado) |
| `media.html` | Media | Producciones con **selector de 1 a 5 géneros activos** y filtro por género |

Reglas de negocio que se ven en pantalla (las valida el backend; el frontend las hace visibles y evita errores comunes):

- Una producción lleva **de 1 a 5 géneros distintos**. El selector bloquea el sexto y avisa si no hay ninguno.
- Director, Productora y Géneros deben estar **Activos** para asignarlos: los inactivos no aparecen en las listas.
- **Serial** y **URL** son únicos: si se repiten, se muestra el mensaje del backend (409).
- No se puede eliminar un registro que esté **en uso** por una producción: se muestra el aviso del backend (409).
- Antes de eliminar se pide confirmación.

## Cómo ejecutarlo

1. **Enciende el backend** (en el repo de la API): `npm run dev` o `npm start`. Por defecto escucha en `http://localhost:5000`.
2. **Abre el frontend.** Dos formas:
   - Con la extensión **Live Server** de VS Code: clic derecho en `index.html` → *Open with Live Server*.
   - O con cualquier otro servidor estático que ya tengas.

> No abras los `.html` con doble clic (`file://`): los módulos de JavaScript (`type="module"`) los bloquea el
> navegador desde ese origen. Necesitan un servidor local, aunque sea el de Live Server.

El backend ya tiene CORS habilitado (`app.use(cors())`), así que el frontend puede estar en otro puerto sin problema.

## Configurar la dirección de la API

Todo está en **una sola línea**, en `js/config.js`:

```js
export const API_URL = 'http://localhost:5000/api/v1';
```

Si el backend se publica (por ejemplo en Render, con MongoDB Atlas), cambia esa línea por la URL pública, sin `/` al final.

## Publicar en Netlify

El frontend es estático, así que no necesita build:

1. Sube esta carpeta a un repositorio nuevo en GitHub (ver más abajo).
2. En Netlify: *Add new site → Import an existing project* y elige el repositorio.
3. Deja **vacíos** *Build command* y *Publish directory* (o pon `.`) y publica.
4. Antes de publicar, `API_URL` debe apuntar a una API **pública** (no `localhost`); si no, la página cargará pero
   no podrá hablar con el backend.

## Estructura

```
index.html  generos.html  directores.html  productoras.html  tipos.html  media.html
css/estilos.css        Estilos propios (variables CSS, grid, modo oscuro, tabla responsive)
js/config.js           Dirección de la API y máximo de géneros
js/api.js              fetch + manejo de errores (unifica los tres formatos de error del backend)
js/ui.js               Utilidades de interfaz (mensajes, diálogo de confirmación, fechas)
js/crud.js             Motor genérico de listar/crear/editar/eliminar
js/generos.js … media.js   Configuración de cada pantalla
```

### Por qué está organizado así

- **Un solo `crud.js`** evita repetir cinco veces la misma lógica; cada módulo solo declara sus campos y columnas.
- **`api.js` es la única capa que usa `fetch`**, así los errores de red y de la API se tratan en un solo sitio.
- **Los datos de la API se pintan con `textContent`/`append`, nunca con `innerHTML`**, para que un nombre con
  etiquetas HTML se muestre como texto y no se ejecute (evita XSS).
- **Accesibilidad:** `header/nav/main/section/form/fieldset/legend/label/table/caption/dialog`, enlace
  «Saltar al contenido», `aria-current` en la navegación, mensajes con `role="alert"/"status"` y foco visible.

## Repositorio

Se recomienda un repositorio aparte del backend (la EA1 ya está entregada y el frontend se despliega por separado):

```bash
git init
git add .
git commit -m "feat: frontend en HTML semántico, CSS y JS para el catálogo"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<nombre-del-repo>.git
git push -u origin main
```
