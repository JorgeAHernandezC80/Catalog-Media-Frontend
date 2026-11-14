// Utilidades de interfaz compartidas.
// Todo el contenido que viene de la API se inserta con textContent/append (nunca
// con innerHTML), así un nombre como "<script>" se muestra como texto y no se ejecuta.

// Crea un elemento: el('p', { class: 'x' }, 'texto', otroNodo)
export function el(etiqueta, propiedades = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(propiedades)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (clave === 'class') nodo.className = valor;
    else if (clave.startsWith('on') && typeof valor === 'function') {
      nodo.addEventListener(clave.slice(2).toLowerCase(), valor);
    } else nodo.setAttribute(clave, valor === true ? '' : valor);
  }
  for (const hijo of hijos.flat()) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    nodo.append(hijo);
  }
  return nodo;
}

// Muestra un mensaje en el contenedor #mensaje.
// Los errores usan role="alert" para que el lector de pantalla los anuncie de inmediato.
export function mostrarMensaje(tipo, texto, detalles = []) {
  const contenedor = document.querySelector('#mensaje');
  if (!contenedor) return;
  contenedor.replaceChildren();
  const caja = el(
    'div',
    { class: `mensaje mensaje-${tipo}`, role: tipo === 'error' ? 'alert' : 'status' },
    el('p', {}, texto),
    detalles.length ? el('ul', {}, detalles.map((d) => el('li', {}, d))) : null
  );
  contenedor.append(caja);
}

export function limpiarMensaje() {
  document.querySelector('#mensaje')?.replaceChildren();
}

// Muestra un error de la API; si trae lista de validaciones, las enumera.
export function mostrarError(error) {
  mostrarMensaje('error', error.message, error.detalles ?? []);
}

// Diálogo de confirmación con <dialog>. Devuelve una promesa con true/false.
export function confirmar(pregunta) {
  const dialogo = document.querySelector('#dialogo-confirmar');
  dialogo.querySelector('#dialogo-texto').textContent = pregunta;
  return new Promise((resolver) => {
    dialogo.addEventListener('close', () => resolver(dialogo.returnValue === 'si'), { once: true });
    dialogo.returnValue = 'no';
    dialogo.showModal();
  });
}

// Las fechas llegan en ISO (2026-11-13T20:45:58.000Z); las mostramos legibles.
export function formatearFecha(iso) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

// El estado se muestra con texto y color: el color solo no basta para quien no lo distingue.
export function insigniaEstado(estado) {
  const activo = estado === 'Activo';
  return el('span', { class: `insignia ${activo ? 'insignia-activo' : 'insignia-inactivo'}` }, estado ?? '—');
}

// Texto opcional: si viene vacío mostramos una raya en vez de una celda en blanco.
export const textoOpcional = (valor) => (valor ? valor : '—');
