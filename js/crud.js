// Motor genérico de las pantallas CRUD (listar, crear, editar, eliminar).
// Las cinco pantallas hacen lo mismo y solo cambian los campos; por eso la lógica
// vive aquí una sola vez y cada módulo (generos.js, media.js...) solo la configura.
import { listar, crear, actualizar, eliminar } from './api.js';
import { el, mostrarMensaje, limpiarMensaje, mostrarError, confirmar } from './ui.js';

/**
 * config:
 *  - recurso:       ruta de la API ('generos')
 *  - singular:      'género'  (para los textos)
 *  - articulo:      'el' | 'la'
 *  - nombreDe(item): texto que identifica el registro en los mensajes
 *  - columnas:      [{ titulo, celda(item) -> Node|string }]
 *  - consulta():    (opcional) parámetros de la consulta, por ejemplo { genero }
 *  - cargarApoyo(): (opcional) carga datos extra antes de pintar (listas para los select)
 *  - leerFormulario(form): (opcional) arma el cuerpo JSON; por defecto lee los campos
 *  - llenarFormulario(form, item): (opcional) rellena el formulario al editar
 *  - reiniciarFormulario(form): (opcional) limpia el formulario
 */
export function iniciarCrud(config) {
  const {
    recurso, singular, articulo, nombreDe, columnas,
    consulta, cargarApoyo, leerFormulario, llenarFormulario, reiniciarFormulario
  } = config;

  const form = document.querySelector('#formulario');
  const tituloForm = document.querySelector('#titulo-formulario');
  const botonGuardar = document.querySelector('#btn-guardar');
  const botonCancelar = document.querySelector('#btn-cancelar');
  const cuerpoTabla = document.querySelector('#tabla-cuerpo');
  const estadoCarga = document.querySelector('#estado-carga');
  const contador = document.querySelector('#contador');
  const tabla = document.querySelector('#tabla');

  let editandoId = null;
  let registros = [];

  // ---------- Listado ----------

  function pintarTabla() {
    cuerpoTabla.replaceChildren();
    for (const item of registros) {
      const fila = el(
        'tr',
        {},
        columnas.map((c) => el('td', { 'data-etiqueta': c.titulo }, c.celda(item))),
        el(
          'td',
          { class: 'acciones', 'data-etiqueta': 'Acciones' },
          el('button', {
            type: 'button', class: 'boton boton-secundario',
            'aria-label': `Editar ${singular} ${nombreDe(item)}`,
            onclick: () => iniciarEdicion(item)
          }, 'Editar'),
          el('button', {
            type: 'button', class: 'boton boton-peligro',
            'aria-label': `Eliminar ${singular} ${nombreDe(item)}`,
            onclick: () => borrar(item)
          }, 'Eliminar')
        )
      );
      cuerpoTabla.append(fila);
    }
    const cantidad = registros.length;
    contador.textContent = cantidad === 1 ? '1 registro' : `${cantidad} registros`;
    tabla.hidden = cantidad === 0;
    estadoCarga.hidden = cantidad !== 0;
    estadoCarga.textContent = `Todavía no hay ${singular}s registrados con este criterio.`;
  }

  async function cargar() {
    estadoCarga.hidden = false;
    estadoCarga.textContent = 'Cargando…';
    tabla.hidden = true;
    try {
      registros = await listar(recurso, consulta?.());
      pintarTabla();
    } catch (error) {
      registros = [];
      tabla.hidden = true;
      estadoCarga.textContent = 'No se pudo cargar el listado.';
      contador.textContent = '';
      mostrarError(error);
    }
  }

  // ---------- Formulario ----------

  function leerPorDefecto(formulario) {
    // Cada input/select/textarea con atributo name se convierte en una propiedad del JSON.
    const datos = {};
    for (const [clave, valor] of new FormData(formulario)) datos[clave] = String(valor).trim();
    return datos;
  }

  function llenarPorDefecto(formulario, item) {
    for (const campo of formulario.elements) {
      if (campo.name && item[campo.name] !== undefined && item[campo.name] !== null) {
        campo.value = item[campo.name];
      }
    }
  }

  function modoCrear() {
    editandoId = null;
    form.reset();
    reiniciarFormulario?.(form);
    tituloForm.textContent = `Nuev${articulo === 'la' ? 'a' : 'o'} ${singular}`;
    botonGuardar.textContent = 'Crear';
    botonCancelar.hidden = true;
  }

  function iniciarEdicion(item) {
    editandoId = item._id;
    form.reset();
    reiniciarFormulario?.(form);
    (llenarFormulario ?? llenarPorDefecto)(form, item);
    tituloForm.textContent = `Editar ${singular}`;
    botonGuardar.textContent = 'Guardar cambios';
    botonCancelar.hidden = false;
    limpiarMensaje();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    form.querySelector('input:not([type=hidden]), select, textarea')?.focus({ preventScroll: true });
  }

  form.addEventListener('submit', async (evento) => {
    // preventDefault evita que el navegador recargue la página al enviar.
    evento.preventDefault();
    if (!form.reportValidity()) return; // muestra los avisos nativos (required, url, min...)

    const cuerpo = (leerFormulario ?? leerPorDefecto)(form);
    const eraEdicion = editandoId !== null;
    botonGuardar.disabled = true; // evita doble envío
    try {
      const guardado = eraEdicion
        ? await actualizar(recurso, editandoId, cuerpo)
        : await crear(recurso, cuerpo);
      modoCrear();
      mostrarMensaje('exito', `${eraEdicion ? 'Cambios guardados' : 'Registro creado'}: ${nombreDe(guardado)}.`);
      await cargarApoyoYListar();
    } catch (error) {
      mostrarError(error);
    } finally {
      botonGuardar.disabled = false;
    }
  });

  botonCancelar.addEventListener('click', () => {
    modoCrear();
    limpiarMensaje();
  });

  // ---------- Eliminar ----------

  async function borrar(item) {
    const ok = await confirmar(`¿Seguro que quieres eliminar ${articulo} ${singular} «${nombreDe(item)}»? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      const respuesta = await eliminar(recurso, item._id);
      if (editandoId === item._id) modoCrear();
      mostrarMensaje('exito', respuesta?.message ?? 'Registro eliminado.');
      await cargarApoyoYListar();
    } catch (error) {
      // 409: el registro está en uso; el mensaje del backend ya explica qué hacer.
      mostrarError(error);
    }
  }

  // ---------- Arranque ----------

  async function cargarApoyoYListar() {
    try {
      await cargarApoyo?.();
    } catch (error) {
      mostrarError(error);
    }
    await cargar();
  }

  modoCrear();
  cargarApoyoYListar();

  // Se devuelve por si un módulo necesita volver a cargar (por ejemplo al cambiar un filtro).
  return { recargar: cargar };
}
