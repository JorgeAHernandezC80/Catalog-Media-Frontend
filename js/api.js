// Capa de acceso a la API. Todas las pantallas pasan por aquí, así el manejo de
// errores y de JSON vive en un solo lugar y no se repite en cada módulo.
import { API_URL } from './config.js';

// Error propio: además del mensaje guarda el código HTTP y, si la API lo envía,
// la lista de errores de validación (el backend de Media devuelve `errores`).
export class ErrorApi extends Error {
  constructor(mensaje, estado = 0, detalles = []) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.estado = estado;
    this.detalles = detalles;
  }
}

// El backend responde con tres formas de error distintas: { message },
// { error } y { message, errores: [...] }. Aquí las unificamos.
// Mongoose a veces antepone "Genero validation failed: " al texto; lo quitamos
// porque es ruido técnico para la persona que usa la pantalla.
function limpiarMensaje(texto) {
  return String(texto).replace(/^.*validation failed:\s*/i, '');
}

function extraerError(datos, estado) {
  const texto = datos?.message ?? datos?.error;
  const detalles = Array.isArray(datos?.errores) ? datos.errores : [];
  if (texto) return new ErrorApi(limpiarMensaje(texto), estado, detalles);
  return new ErrorApi(`La API respondió con un error (código ${estado}).`, estado, detalles);
}

async function pedir(ruta, { metodo = 'GET', cuerpo, parametros } = {}) {
  let url = `${API_URL}/${ruta}`;
  if (parametros) {
    // Ignoramos los parámetros vacíos para no enviar "?genero=" sin valor.
    const consulta = new URLSearchParams(
      Object.entries(parametros).filter(([, valor]) => valor !== '' && valor != null)
    ).toString();
    if (consulta) url += `?${consulta}`;
  }

  const opciones = { method: metodo, headers: { Accept: 'application/json' } };
  if (cuerpo !== undefined) {
    opciones.headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch {
    // fetch solo lanza excepción cuando no hay conexión (API apagada, CORS, red).
    throw new ErrorApi(
      'No se pudo conectar con la API. Revisa que el servidor esté encendido y que la dirección en js/config.js sea correcta.'
    );
  }

  // Si la respuesta no trae JSON válido, seguimos con datos nulos.
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw extraerError(datos, respuesta.status);
  return datos;
}

export const listar = (recurso, parametros) => pedir(recurso, { parametros });
export const crear = (recurso, cuerpo) => pedir(recurso, { metodo: 'POST', cuerpo });
export const actualizar = (recurso, id, cuerpo) => pedir(`${recurso}/${id}`, { metodo: 'PUT', cuerpo });
export const eliminar = (recurso, id) => pedir(`${recurso}/${id}`, { metodo: 'DELETE' });
