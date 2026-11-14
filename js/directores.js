import { iniciarCrud } from './crud.js';
import { formatearFecha, insigniaEstado } from './ui.js';

// OJO: en el modelo Director el campo se llama "nombres" (en plural), no "nombre".
iniciarCrud({
  recurso: 'directores',
  singular: 'director',
  articulo: 'el',
  nombreDe: (d) => d.nombres,
  columnas: [
    { titulo: 'Nombres', celda: (d) => d.nombres },
    { titulo: 'Estado', celda: (d) => insigniaEstado(d.estado) },
    { titulo: 'Creado', celda: (d) => formatearFecha(d.createdAt) },
    { titulo: 'Actualizado', celda: (d) => formatearFecha(d.updatedAt) }
  ]
});
