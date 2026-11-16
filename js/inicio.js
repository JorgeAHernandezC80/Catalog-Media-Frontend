// Página de inicio en forma de cartelera de cine.
// - Arriba muestra la última producción agregada como "destacada".
// - Abajo muestra todas las producciones como pósters, con búsqueda por título
//   y filtros por tipo y por género.
// - Al hacer clic en un póster se abre una ficha con el detalle.
// Igual que en el resto del sitio, los datos de la API se pintan con
// textContent/append (función el), nunca con innerHTML, para evitar XSS.
import { listar } from './api.js';
import { el, mostrarError } from './ui.js';

// 1. Estado de la página (qué producciones hay y qué filtros están activos).

const estado = {
  producciones: [],
  tipo: '',    // _id del tipo elegido ('' = todos)
  genero: '',  // _id del género elegido ('' = todos)
  texto: ''    // texto del buscador
};

const $ = (selector) => document.querySelector(selector);

// 2. Utilidades

// Solo aceptamos enlaces http/https. El backend ya lo valida, pero si llegara
// otra cosa (por ejemplo "javascript:..."), no la ponemos en un href.
function urlSegura(valor) {
  try {
    const url = new URL(valor);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

// Quita tildes y mayúsculas para que "accion" encuentre "Acción".
const normalizar = (texto) =>
  String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Póster de reemplazo cuando la producción no tiene portada o la imagen falla:
// un "telón" con el título escrito.
function posterVacio(titulo) {
  return el('div', { class: 'poster-vacio', 'aria-hidden': 'true' }, el('span', {}, titulo));
}

// Devuelve la portada (img) o el póster de reemplazo.
function poster(media, { perezoso = true } = {}) {
  const src = urlSegura(media.portada);
  if (!src) return posterVacio(media.titulo);
  return el('img', {
    src,
    alt: `Póster de ${media.titulo}`,
    loading: perezoso ? 'lazy' : 'eager',
    // Si la imagen no carga, se cambia por el póster de reemplazo.
    onerror: (e) => e.target.replaceWith(posterVacio(media.titulo))
  });
}

// Año y tipo, cada uno en su propia etiqueta.
function datosBasicos(media, clase) {
  return el(
    'p',
    { class: clase },
    el('span', { class: 'dato' }, String(media.anoEstreno ?? '—')),
    media.tipo?.nombre ? el('span', { class: 'dato dato-tipo' }, media.tipo.nombre) : null
  );
}

function chipsGeneros(media) {
  const generos = media.generos ?? [];
  if (!generos.length) return null;
  return el('ul', { class: 'generos', 'aria-label': 'Géneros' },
    generos.map((g) => el('li', {}, g.nombre ?? '(sin nombre)')));
}

// 3. Película destacada

function pintarDestacada(media) {
  const etiqueta = $('#destacada-etiqueta');
  const titulo = $('#destacada-titulo');
  const datos = $('#destacada-datos');
  const sinopsis = $('#destacada-sinopsis');
  const creditos = $('#destacada-creditos');
  const acciones = $('#destacada-acciones');
  const portada = $('#destacada-portada');
  const fondo = $('#destacada-fondo');

  if (!media) {
    etiqueta.textContent = 'La cartelera está vacía';
    titulo.textContent = 'Catálogo de películas y series';
    sinopsis.textContent = 'Todavía no hay producciones registradas. Agrega la primera desde el módulo Media y aparecerá aquí.';
    acciones.replaceChildren(el('a', { class: 'boton boton-terciopelo', href: 'media.html' }, 'Agregar una producción'));
    $('#destacada').classList.add('destacada-sin-pelicula');
    return;
  }

  $('#destacada').classList.remove('destacada-sin-pelicula');
  etiqueta.textContent = 'Recién agregada al catálogo';
  titulo.textContent = media.titulo;
  datos.replaceChildren(datosBasicos(media, 'datos'), chipsGeneros(media) ?? '');
  sinopsis.textContent = media.sinopsis ?? '';

  const lineas = [];
  if (media.director?.nombres) lineas.push(el('span', {}, 'Dirigida por ', el('strong', {}, media.director.nombres)));
  if (media.productora?.nombre) lineas.push(el('span', {}, 'Producida por ', el('strong', {}, media.productora.nombre)));
  creditos.replaceChildren(...lineas);

  const enlace = urlSegura(media.url);
  acciones.replaceChildren(
    el('button', { type: 'button', class: 'boton boton-terciopelo', onclick: () => abrirDetalle(media) }, 'Ver detalles'),
    enlace
      ? el('a', { class: 'boton boton-contorno', href: enlace, target: '_blank', rel: 'noopener noreferrer' }, 'Ver producción')
      : null
  );

  portada.replaceChildren(poster(media, { perezoso: false }));

  // El fondo es la misma portada, difuminada. Se usa un <img> y no CSS
  // (background-image) para no armar estilos con texto que viene de la API.
  const src = urlSegura(media.portada);
  fondo.replaceChildren(src ? el('img', { src, alt: '', onerror: (e) => e.target.remove() }) : '');
}

// 4. Filtros

// Botones de filtro: uno marcado con aria-pressed="true".
function botonesFiltro(contenedor, opciones, valorActual, alElegir) {
  contenedor.replaceChildren(
    ...opciones.map(({ valor, texto }) =>
      el('button', {
        type: 'button',
        class: 'filtro-opcion',
        'aria-pressed': String(valor === valorActual),
        onclick: () => alElegir(valor)
      }, texto)
    )
  );
}

// Solo se ofrecen los tipos y géneros que tienen producciones,
// así ningún filtro deja la cartelera vacía.
function unicos(listas) {
  const mapa = new Map();
  for (const item of listas.flat()) {
    if (item?._id && !mapa.has(item._id)) mapa.set(item._id, item);
  }
  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function pintarFiltros() {
  const tipos = unicos(estado.producciones.map((m) => [m.tipo]));
  const generos = unicos(estado.producciones.map((m) => m.generos ?? []));

  // Si solo hay un tipo, el filtro no aporta nada y se oculta.
  $('#filtro-tipo').hidden = tipos.length < 2;
  botonesFiltro(
    $('#filtro-tipo'),
    [{ valor: '', texto: 'Todo' }, ...tipos.map((t) => ({ valor: t._id, texto: t.nombre }))],
    estado.tipo,
    (valor) => { estado.tipo = valor; pintarFiltros(); pintarCartelera(); }
  );

  $('#filtro-genero').hidden = generos.length === 0;
  botonesFiltro(
    $('#filtro-genero'),
    [{ valor: '', texto: 'Todos los géneros' }, ...generos.map((g) => ({ valor: g._id, texto: g.nombre }))],
    estado.genero,
    (valor) => { estado.genero = valor; pintarFiltros(); pintarCartelera(); }
  );
}

// 5. Cartelera

function filtrar() {
  const texto = normalizar(estado.texto.trim());
  return estado.producciones.filter((m) =>
    (!estado.tipo || m.tipo?._id === estado.tipo) &&
    (!estado.genero || (m.generos ?? []).some((g) => g._id === estado.genero)) &&
    (!texto || normalizar(m.titulo).includes(texto))
  );
}

function tarjeta(media) {
  return el(
    'li',
    {},
    el(
      'button',
      {
        type: 'button',
        class: 'funcion',
        'aria-haspopup': 'dialog',
        'aria-label': `${media.titulo} (${media.anoEstreno}). Ver detalles`,
        onclick: () => abrirDetalle(media)
      },
      el('span', { class: 'funcion-portada' }, poster(media)),
      el('span', { class: 'funcion-titulo' }, media.titulo),
      datosBasicos(media, 'funcion-datos')
    )
  );
}

function pintarCartelera() {
  const lista = $('#funciones');
  const aviso = $('#cartelera-estado');
  const visibles = filtrar();
  const total = estado.producciones.length;

  $('#cartelera-total').textContent = visibles.length === total
    ? `${total} ${total === 1 ? 'producción' : 'producciones'}`
    : `${visibles.length} de ${total} producciones`;

  lista.replaceChildren(...visibles.map(tarjeta));
  lista.hidden = visibles.length === 0;
  aviso.hidden = visibles.length !== 0;

  if (total === 0) {
    aviso.replaceChildren('Aún no hay producciones. ', el('a', { href: 'media.html' }, 'Agrega la primera en Media'), '.');
  } else if (visibles.length === 0) {
    aviso.replaceChildren(
      'Ninguna producción coincide con la búsqueda. ',
      el('button', { type: 'button', class: 'enlace-boton', onclick: limpiarFiltros }, 'Quitar filtros')
    );
  }
}

function limpiarFiltros() {
  estado.tipo = '';
  estado.genero = '';
  estado.texto = '';
  $('#buscar').value = '';
  pintarFiltros();
  pintarCartelera();
}

// 6. Ficha de detalle

function abrirDetalle(media) {
  const dialogo = $('#detalle');
  $('#detalle-titulo').textContent = media.titulo;
  $('#detalle-datos').replaceChildren(datosBasicos(media, 'datos'), chipsGeneros(media) ?? '');
  $('#detalle-sinopsis').textContent = media.sinopsis ?? '';
  $('#detalle-portada').replaceChildren(poster(media, { perezoso: false }));

  const filas = [
    ['Director', media.director?.nombres],
    ['Productora', media.productora?.nombre],
    ['Serial', media.serial]
  ].filter(([, valor]) => valor);
  $('#detalle-ficha').replaceChildren(
    ...filas.flatMap(([termino, valor]) => [el('dt', {}, termino), el('dd', {}, valor)])
  );

  const enlace = $('#detalle-enlace');
  const url = urlSegura(media.url);
  enlace.hidden = !url;
  if (url) enlace.href = url;

  dialogo.showModal();
}

// Clic fuera de la ficha (en el fondo oscuro) la cierra, como en los sitios de cine.
$('#detalle').addEventListener('click', (evento) => {
  if (evento.target === evento.currentTarget) evento.currentTarget.close();
});

// 7. Carga

async function cargarCartelera() {
  // En el plan gratis de Render el servidor se apaga si no se usa; si tarda,
  // avisamos para que no parezca que la página se dañó.
  const avisoLento = setTimeout(() => {
    $('#cartelera-estado').textContent = 'El servidor se está encendiendo. Esto puede tardar hasta un minuto…';
  }, 5000);

  try {
    const producciones = await listar('media');
    // Las más recientes primero; la primera es la destacada.
    estado.producciones = producciones.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    pintarDestacada(estado.producciones[0]);
    pintarFiltros();
    pintarCartelera();
    $('[data-conteo="media"]').textContent = producciones.length;
  } catch (error) {
    $('#destacada-etiqueta').textContent = 'No se pudo cargar la cartelera';
    $('#cartelera-estado').textContent = 'No se pudo cargar la cartelera. Recarga la página en unos segundos.';
    $('[data-conteo="media"]').textContent = '—';
    mostrarError(error);
  } finally {
    clearTimeout(avisoLento);
  }
}

// Conteos de la sección "Administrar el catálogo".
async function cargarConteos() {
  const modulos = ['generos', 'directores', 'productoras', 'tipos'];
  const resultados = await Promise.allSettled(modulos.map((m) => listar(m)));
  resultados.forEach((resultado, i) => {
    $(`[data-conteo="${modulos[i]}"]`).textContent =
      resultado.status === 'fulfilled' ? resultado.value.length : '—';
  });
}

$('#buscar').addEventListener('input', (evento) => {
  estado.texto = evento.target.value;
  pintarCartelera();
});

cargarCartelera();
cargarConteos();