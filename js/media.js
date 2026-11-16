// Pantalla de Media (películas y series). Es la más completa: tiene listas
// desplegables para Director y Tipo, y dos selectores de casillas: de 1 a 5 productoras y de 1 a 5 géneros.
import { iniciarCrud } from './crud.js';
import { listar } from './api.js';
import { MAX_GENEROS, MAX_PRODUCTORAS } from './config.js';
import { el, formatearFecha } from './ui.js';

const selectDirector = document.querySelector('#director');
const selectTipo = document.querySelector('#tipo');
const filtroGenero = document.querySelector('#filtro-genero');

// Catálogos que se llenan desde la API (se vuelven a pedir tras cada cambio).
let catalogo = { generos: [], directores: [], productoras: [], tipos: [] };

// ---------- Listas desplegables ----------

// Solo se ofrecen los registros Activos, porque el backend rechaza los Inactivos
// (reglas IX, X y XI del caso de estudio). Si al EDITAR la producción ya tenía uno
// Inactivo, se deja visible para no mostrar un campo vacío que confunda.
function pintarSelect(select, lista, etiqueta, idActual = '') {
  const opciones = lista.filter((x) => x.estado !== 'Inactivo' || x._id === idActual);
  select.replaceChildren(
    el('option', { value: '' }, 'Selecciona una opción…'),
    // replaceChildren recibe nodos sueltos, no un arreglo: por eso se usa "..." (spread).
    ...opciones.map((x) =>
      el('option', { value: x._id }, x.estado === 'Inactivo' ? `${etiqueta(x)} (Inactivo)` : etiqueta(x))
    )
  );
  select.value = idActual;
}

// ---------- Selectores de casillas (1 a 5) ----------

// Géneros y Productoras funcionan igual: una lista de casillas con mínimo 1 y máximo 5.
// Esta función crea el selector una sola vez para cada uno, en vez de repetir el código.
//   campo:    nombre del campo en la API ('generos' o 'productoras')
//   maximo:   tope de elementos
//   mensajeMinimo: texto cuando no hay ninguna casilla marcada
//   vacio:    texto cuando no hay registros activos
//   etiquetaDe: cómo se escribe el nombre de cada registro
function crearSelectorMultiple({ campo, maximo, mensajeMinimo, vacio, etiquetaDe }) {
  const lista = document.querySelector(`#lista-${campo}`);
  const contador = document.querySelector(`#contador-${campo}`);

  function actualizar() {
    const total = lista.querySelectorAll('input:checked').length;
    contador.textContent = `${total} de ${maximo} seleccionados`;

    // Al llegar al máximo se bloquean los demás: es más claro que dejar marcar y fallar al enviar.
    for (const caja of lista.querySelectorAll('input')) {
      caja.disabled = total >= maximo && !caja.checked;
    }

    // Los checkbox no tienen "required" de grupo, así que el "al menos uno" se valida a mano
    // con setCustomValidity; reportValidity() del formulario mostrará este texto.
    const primera = lista.querySelector('input');
    if (primera) primera.setCustomValidity(total === 0 ? mensajeMinimo : '');
  }

  // 'registros' son todos los de la API; 'seleccionados' los ids marcados (al editar).
  function pintar(registros, seleccionados = []) {
    const visibles = registros.filter((r) => r.estado !== 'Inactivo' || seleccionados.includes(r._id));
    if (visibles.length === 0) {
      lista.replaceChildren(el('p', { class: 'ayuda' }, vacio));
      contador.textContent = '';
      return;
    }
    lista.replaceChildren(
      ...visibles.map((r) =>
        el(
          'label',
          { class: 'opcion-genero' },
          el('input', {
            type: 'checkbox', name: campo, value: r._id,
            checked: seleccionados.includes(r._id), onchange: actualizar
          }),
          el('span', {}, r.estado === 'Inactivo' ? `${etiquetaDe(r)} (Inactivo)` : etiquetaDe(r))
        )
      )
    );
    actualizar();
  }

  const marcados = () => [...lista.querySelectorAll('input:checked')].map((c) => c.value);
  return { pintar, marcados };
}

const selectorGeneros = crearSelectorMultiple({
  campo: 'generos',
  maximo: MAX_GENEROS,
  mensajeMinimo: 'Elige al menos un género.',
  vacio: 'No hay géneros activos. Crea uno primero en la sección Géneros.',
  etiquetaDe: (g) => g.nombre
});

const selectorProductoras = crearSelectorMultiple({
  campo: 'productoras',
  maximo: MAX_PRODUCTORAS,
  mensajeMinimo: 'Elige al menos una productora.',
  vacio: 'No hay productoras activas. Crea una primero en la sección Productoras.',
  etiquetaDe: (p) => p.nombre
});

// ---------- Carga de apoyo ----------

async function cargarApoyo() {
  const [generos, directores, productoras, tipos] = await Promise.all([
    listar('generos'), listar('directores'), listar('productoras'), listar('tipos')
  ]);
  catalogo = { generos, directores, productoras, tipos };

  pintarSelect(selectDirector, directores, (d) => d.nombres);
  pintarSelect(selectTipo, tipos, (t) => t.nombre);
  selectorProductoras.pintar(productoras);
  selectorGeneros.pintar(generos);

  // El filtro conserva la opción elegida aunque se vuelva a pintar.
  const elegido = filtroGenero.value;
  filtroGenero.replaceChildren(
    el('option', { value: '' }, 'Todos los géneros'),
    ...generos.map((g) => el('option', { value: g._id }, g.nombre))
  );
  filtroGenero.value = generos.some((g) => g._id === elegido) ? elegido : '';
}

// ---------- Formulario ----------

function leerFormulario(form) {
  const dato = (nombre) => form.elements[nombre].value.trim();
  return {
    serial: dato('serial'),
    titulo: dato('titulo'),
    sinopsis: dato('sinopsis'),
    url: dato('url'),
    portada: dato('portada'),
    anoEstreno: Number(dato('anoEstreno')),
    // El backend espera una LISTA de IDs en "generos", no un solo valor.
    generos: selectorGeneros.marcados(),
    director: selectDirector.value,
    // Igual que géneros: el backend espera una LISTA de IDs en "productoras".
    productoras: selectorProductoras.marcados(),
    tipo: selectTipo.value
  };
}

// En el listado los datos relacionados llegan "poblados" (objetos); para editar
// necesitamos solo el _id de cada uno.
const idDe = (relacion) => relacion?._id ?? relacion ?? '';

function llenarFormulario(form, media) {
  for (const campo of ['serial', 'titulo', 'sinopsis', 'url', 'portada', 'anoEstreno']) {
    form.elements[campo].value = media[campo] ?? '';
  }
  pintarSelect(selectDirector, catalogo.directores, (d) => d.nombres, idDe(media.director));
  pintarSelect(selectTipo, catalogo.tipos, (t) => t.nombre, idDe(media.tipo));
  selectorProductoras.pintar(catalogo.productoras, (media.productoras ?? []).map(idDe));
  selectorGeneros.pintar(catalogo.generos, (media.generos ?? []).map(idDe));
}

// Al volver al modo "crear" se repintan las listas sin selección previa.
function reiniciarFormulario() {
  if (!catalogo.generos.length && !catalogo.directores.length) return;
  pintarSelect(selectDirector, catalogo.directores, (d) => d.nombres);
  pintarSelect(selectTipo, catalogo.tipos, (t) => t.nombre);
  selectorProductoras.pintar(catalogo.productoras);
  selectorGeneros.pintar(catalogo.generos);
}

// ---------- Tabla ----------

const chipsGeneros = (media) =>
  el(
    'ul',
    { class: 'chips', 'aria-label': 'Géneros' },
    (media.generos ?? []).map((g) => el('li', { class: 'chip' }, g.nombre ?? '(sin nombre)'))
  );

const chipsProductoras = (media) =>
  el(
    'ul',
    { class: 'chips', 'aria-label': 'Productoras' },
    (media.productoras ?? []).map((p) => el('li', { class: 'chip' }, p.nombre ?? '(sin nombre)'))
  );

function celdaTitulo(media) {
  return el(
    'div',
    { class: 'titulo-media' },
    media.portada
      ? el('img', {
          src: media.portada, alt: `Portada de ${media.titulo}`, loading: 'lazy', width: 48, height: 68,
          // Si la imagen no carga, se oculta para no dejar el icono roto.
          onerror: (e) => e.target.setAttribute('hidden', '')
        })
      : null,
    el(
      'div',
      {},
      el('strong', {}, media.titulo),
      el('span', { class: 'secundario' }, ` (${media.anoEstreno})`),
      el('br'),
      el('a', { href: media.url, target: '_blank', rel: 'noopener noreferrer' }, 'Ver producción')
    )
  );
}

const crud = iniciarCrud({
  recurso: 'media',
  singular: 'producción',
  articulo: 'la',
  nombreDe: (m) => m.titulo,
  consulta: () => ({ genero: filtroGenero.value }),
  cargarApoyo,
  leerFormulario,
  llenarFormulario,
  reiniciarFormulario,
  columnas: [
    { titulo: 'Serial', celda: (m) => m.serial },
    { titulo: 'Producción', celda: celdaTitulo },
    { titulo: 'Tipo', celda: (m) => m.tipo?.nombre ?? '—' },
    { titulo: 'Géneros', celda: chipsGeneros },
    { titulo: 'Director', celda: (m) => m.director?.nombres ?? '—' },
    { titulo: 'Productoras', celda: chipsProductoras },
    {
      titulo: 'Fechas',
      celda: (m) =>
        el('small', {}, `Creado: ${formatearFecha(m.createdAt)}`, el('br'), `Actualizado: ${formatearFecha(m.updatedAt)}`)
    }
  ]
});

// Al cambiar el filtro se pide de nuevo el listado con ?genero=<id>.
filtroGenero.addEventListener('change', () => crud.recargar());