// Página de inicio en forma de cartelera de cine.
// - Arriba, en el "escenario", muestra la última producción agregada como destacada,
//   con su póster y una cinta de celuloide con las portadas del catálogo.
// - Abajo muestra todas las producciones como pósters, con búsqueda por título
//   y filtros por tipo y por género.
// - Al hacer clic en un póster se abre una ficha con el detalle.
// Igual que en el resto del sitio, los datos de la API se pintan con
// textContent/append (función el), nunca con innerHTML, para evitar XSS.
import { listar } from './api.js';
import { el, mostrarError } from './ui.js';

// ---------- Estado de la página ----------

const estado = {
  producciones: [],
  tipo: '',    // _id del tipo elegido ('' = todos)
  genero: '',  // _id del género elegido ('' = todos)
  texto: ''    // texto del buscador
};

const $ = (selector) => document.querySelector(selector);

// Iconos pequeños que se repiten (son fijos, no vienen de la API).
const NS = 'http://www.w3.org/2000/svg';
function icono(ruta, ancho, alto) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', ruta);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'currentColor');
  path.setAttribute('stroke-width', '1.6');
  svg.append(path);
  return svg;
}
const iconoPlay = () => {
  const svg = icono('M1 1l10 6-10 6z', 12, 14);
  svg.querySelector('path').setAttribute('fill', 'currentColor');
  return svg;
};
const iconoFlecha = () => icono('M1 7h16 M12 2l5 5-5 5', 18, 14);

// ---------- Utilidades ----------

// Solo aceptamos enlaces http/https. El backend ya lo valida, pero si llegara
// otra cosa (por ejemplo "javascript:..."), no la ponemos en un href ni en un src.
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

// Póster de reemplazo cuando la producción no tiene portada o la imagen falla.
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
    onerror: (e) => e.target.replaceWith(posterVacio(media.titulo))
  });
}

// "Una película de Ti West • 2026 • Drama", como en los créditos de un cartel.
function lineaCreditos(media) {
  const partes = [];
  const tipo = media.tipo?.nombre;
  const director = media.director?.nombres;
  if (director) {
    if (tipo) {
      // "Una película", "Una serie", "Un documental"...
      const articulo = /a$/i.test(tipo) ? 'Una' : 'Un';
      partes.push(`${articulo} ${tipo.toLowerCase()} de ${director}`);
    } else {
      partes.push(`Dirigida por ${director}`);
    }
  } else if (tipo) {
    partes.push(tipo);
  }
  if (media.anoEstreno) partes.push(String(media.anoEstreno));
  const genero = media.generos?.[0]?.nombre;
  if (genero) partes.push(genero);
  return partes.join(' • ');
}

function listaGeneros(media) {
  return (media.generos ?? []).map((g) => el('li', {}, g.nombre ?? '(sin nombre)'));
}

// ---------- Escenario (película destacada) ----------

// Quita los esqueletos de carga del escenario.
function terminarCarga() {
  const escenario = $('#escenario');
  escenario.classList.remove('cargando');
  escenario.setAttribute('aria-busy', 'false');
  $('#destacada-imagen').classList.remove('esqueleto');
}

function pintarDestacada(media) {
  const etiqueta = $('#destacada-etiqueta');
  const titulo = $('#destacada-titulo');
  const meta = $('#destacada-meta');
  const sinopsis = $('#destacada-sinopsis');
  const acciones = $('#destacada-acciones');
  const portada = $('#destacada-portada');

  terminarCarga();

  if (!media) {
    etiqueta.textContent = 'Cartelera vacía';
    titulo.textContent = 'Aún no hay funciones';
    meta.textContent = '';
    sinopsis.textContent = 'Cuando se agregue la primera producción, aparecerá aquí.';
    acciones.replaceChildren(el('a', { class: 'boton-oro', href: 'media.html' }, 'Agregar una producción', iconoFlecha()));
    portada.hidden = true;
    return;
  }

  etiqueta.textContent = 'Película destacada';
  if (media.tipo?.nombre && !/pel[ií]cula/i.test(media.tipo.nombre)) {
    etiqueta.textContent = `${media.tipo.nombre} destacada`;
  }
  titulo.textContent = media.titulo;
  meta.textContent = lineaCreditos(media);
  sinopsis.textContent = media.sinopsis ?? '';

  const enlace = urlSegura(media.url);
  acciones.replaceChildren(
    enlace
      ? el('a', { class: 'boton-oro', href: enlace, target: '_blank', rel: 'noopener noreferrer' }, 'Ver producción', iconoPlay())
      : null,
    el('button', { type: 'button', class: 'boton-texto', onclick: () => abrirDetalle(media) }, 'Ver detalles', iconoFlecha())
  );

  $('#destacada-imagen').replaceChildren(poster(media, { perezoso: false }));
  portada.hidden = false;
}

// Cinta de celuloide: las portadas del catálogo como fotogramas.
// Si ninguna producción tiene portada, la cinta no se muestra.
function pintarCinta() {
  const conPortada = estado.producciones.filter((m) => urlSegura(m.portada));
  const contenedor = $('#cinta-contenedor');
  contenedor.hidden = conPortada.length === 0;
  if (!conPortada.length) return;

  const cuadros = [];
  for (let i = 0; i < 8; i++) {
    const media = conPortada[i % conPortada.length];
    cuadros.push(el('span', { class: 'cuadro' },
      el('img', { src: urlSegura(media.portada), alt: '', loading: 'lazy', onerror: (e) => e.target.remove() })));
  }
  $('#cinta').replaceChildren(...cuadros);
}

// ---------- Filtros ----------

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

// ---------- Cartelera ----------

function filtrar() {
  const texto = normalizar(estado.texto.trim());
  return estado.producciones.filter((m) =>
    (!estado.tipo || m.tipo?._id === estado.tipo) &&
    (!estado.genero || (m.generos ?? []).some((g) => g._id === estado.genero)) &&
    (!texto || normalizar(m.titulo).includes(texto))
  );
}

function tarjeta(media) {
  const datos = [media.anoEstreno, media.tipo?.nombre].filter(Boolean).join(' • ');
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
      el('span', { class: 'funcion-datos' }, datos)
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

  lista.setAttribute('aria-busy', 'false');
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

// ---------- Ficha de detalle ----------

function abrirDetalle(media) {
  $('#detalle-titulo').textContent = media.titulo;
  $('#detalle-meta').textContent = lineaCreditos(media);
  $('#detalle-generos').replaceChildren(...listaGeneros(media));
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

  $('#detalle').showModal();
}

// Clic fuera de la ficha (en el fondo oscuro) la cierra, como en los sitios de cine.
$('#detalle').addEventListener('click', (evento) => {
  if (evento.target === evento.currentTarget) evento.currentTarget.close();
});

// ---------- Carga ----------

function ponerCifra(modulo, valor) {
  for (const nodo of document.querySelectorAll(`[data-cifra="${modulo}"]`)) nodo.textContent = valor;
}

async function cargarCartelera() {
  // En el plan gratis de Render el servidor se apaga si no se usa. Si tarda,
  // avisamos debajo de los esqueletos para que no parezca que la página se dañó.
  const avisoLento = setTimeout(() => {
    const aviso = $('#cartelera-estado');
    aviso.textContent = 'El servidor se está encendiendo; puede tardar hasta un minuto.';
    aviso.hidden = false;
  }, 6000);

  try {
    const producciones = await listar('media');
    // Las más recientes primero; la primera es la destacada.
    estado.producciones = producciones.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    pintarDestacada(estado.producciones[0]);
    pintarCinta();
    pintarFiltros();
    pintarCartelera();
    ponerCifra('media', producciones.length);
  } catch (error) {
    terminarCarga();
    $('#destacada-etiqueta').textContent = 'Sin conexión';
    $('#destacada-titulo').textContent = 'No se pudo cargar la cartelera';
    $('#destacada-meta').textContent = '';
    $('#destacada-sinopsis').textContent = 'Recarga la página en unos segundos.';
    $('#destacada-portada').hidden = true;
    $('#funciones').replaceChildren();
    $('#funciones').hidden = true;
    mostrarError(error);
  } finally {
    clearTimeout(avisoLento);
  }
}

// Cifras de la barra inferior del escenario.
async function cargarCifras() {
  const modulos = ['generos', 'directores'];
  const resultados = await Promise.allSettled(modulos.map((m) => listar(m)));
  resultados.forEach((resultado, i) => {
    if (resultado.status === 'fulfilled') ponerCifra(modulos[i], resultado.value.length);
  });
}

$('#buscar').addEventListener('input', (evento) => {
  estado.texto = evento.target.value;
  pintarCartelera();
});

cargarCartelera();
cargarCifras();