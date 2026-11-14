// Pantalla de Media (películas y series). Es la más completa: tiene listas
// desplegables para Director, Productora y Tipo, y un selector de 1 a 5 géneros.
import { iniciarCrud } from './crud.js';
import { listar } from './api.js';
import { MAX_GENEROS } from './config.js';
import { el, formatearFecha } from './ui.js';

const selectDirector = document.querySelector('#director');
const selectProductora = document.querySelector('#productora');
const selectTipo = document.querySelector('#tipo');
const listaGeneros = document.querySelector('#lista-generos');
const contadorGeneros = document.querySelector('#contador-generos');
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

// ---------- Selector de géneros (1 a 5) ----------

function actualizarGeneros() {
  const marcados = listaGeneros.querySelectorAll('input:checked');
  const total = marcados.length;
  contadorGeneros.textContent = `${total} de ${MAX_GENEROS} seleccionados`;

  // Al llegar al máximo se bloquean los demás: es más claro que dejar marcar y fallar al enviar.
  for (const caja of listaGeneros.querySelectorAll('input')) {
    caja.disabled = total >= MAX_GENEROS && !caja.checked;
  }

  // Los checkbox no tienen "required" de grupo, así que el "al menos uno" se valida a mano
  // con setCustomValidity; reportValidity() del formulario mostrará este texto.
  const primera = listaGeneros.querySelector('input');
  if (primera) primera.setCustomValidity(total === 0 ? 'Elige al menos un género.' : '');
}

function pintarGeneros(seleccionados = []) {
  const visibles = catalogo.generos.filter((g) => g.estado !== 'Inactivo' || seleccionados.includes(g._id));
  if (visibles.length === 0) {
    listaGeneros.replaceChildren(
      el('p', { class: 'ayuda' }, 'No hay géneros activos. Crea uno primero en la sección Géneros.')
    );
    contadorGeneros.textContent = '';
    return;
  }
  listaGeneros.replaceChildren(
    ...visibles.map((g) =>
      el(
        'label',
        { class: 'opcion-genero' },
        el('input', {
          type: 'checkbox', name: 'generos', value: g._id,
          checked: seleccionados.includes(g._id), onchange: actualizarGeneros
        }),
        el('span', {}, g.estado === 'Inactivo' ? `${g.nombre} (Inactivo)` : g.nombre)
      )
    )
  );
  actualizarGeneros();
}

// ---------- Carga de apoyo ----------

async function cargarApoyo() {
  const [generos, directores, productoras, tipos] = await Promise.all([
    listar('generos'), listar('directores'), listar('productoras'), listar('tipos')
  ]);
  catalogo = { generos, directores, productoras, tipos };

  pintarSelect(selectDirector, directores, (d) => d.nombres);
  pintarSelect(selectProductora, productoras, (p) => p.nombre);
  pintarSelect(selectTipo, tipos, (t) => t.nombre);
  pintarGeneros();

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
    generos: [...listaGeneros.querySelectorAll('input:checked')].map((c) => c.value),
    director: selectDirector.value,
    productora: selectProductora.value,
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
  const idsGeneros = (media.generos ?? []).map(idDe);
  pintarSelect(selectDirector, catalogo.directores, (d) => d.nombres, idDe(media.director));
  pintarSelect(selectProductora, catalogo.productoras, (p) => p.nombre, idDe(media.productora));
  pintarSelect(selectTipo, catalogo.tipos, (t) => t.nombre, idDe(media.tipo));
  pintarGeneros(idsGeneros);
}

// Al volver al modo "crear" se repintan las listas sin selección previa.
function reiniciarFormulario() {
  if (!catalogo.generos.length && !catalogo.directores.length) return;
  pintarSelect(selectDirector, catalogo.directores, (d) => d.nombres);
  pintarSelect(selectProductora, catalogo.productoras, (p) => p.nombre);
  pintarSelect(selectTipo, catalogo.tipos, (t) => t.nombre);
  pintarGeneros();
}

// ---------- Tabla ----------

const chipsGeneros = (media) =>
  el(
    'ul',
    { class: 'chips', 'aria-label': 'Géneros' },
    (media.generos ?? []).map((g) => el('li', { class: 'chip' }, g.nombre ?? '(sin nombre)'))
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
    { titulo: 'Productora', celda: (m) => m.productora?.nombre ?? '—' },
    {
      titulo: 'Fechas',
      celda: (m) =>
        el('small', {}, `Creado: ${formatearFecha(m.createdAt)}`, el('br'), `Actualizado: ${formatearFecha(m.updatedAt)}`)
    }
  ]
});

// Al cambiar el filtro se pide de nuevo el listado con ?genero=<id>.
filtroGenero.addEventListener('change', () => crud.recargar());
