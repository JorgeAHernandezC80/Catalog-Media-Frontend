// Página de inicio: muestra cuántos registros hay en cada módulo.
// Sirve además como prueba rápida de que la API está encendida y bien configurada.
import { listar } from './api.js';
import { mostrarError } from './ui.js';

const modulos = ['generos', 'directores', 'productoras', 'tipos', 'media'];

async function cargarConteos() {
  const resultados = await Promise.allSettled(modulos.map((m) => listar(m)));
  let primerError = null;

  resultados.forEach((resultado, i) => {
    const salida = document.querySelector(`[data-conteo="${modulos[i]}"]`);
    if (resultado.status === 'fulfilled') {
      salida.textContent = resultado.value.length;
    } else {
      salida.textContent = '—';
      primerError ??= resultado.reason;
    }
  });

  if (primerError) mostrarError(primerError);
}

cargarConteos();
