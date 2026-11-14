import { iniciarCrud } from './crud.js';
import { formatearFecha, insigniaEstado, textoOpcional } from './ui.js';

iniciarCrud({
  recurso: 'generos',
  singular: 'género',
  articulo: 'el',
  nombreDe: (g) => g.nombre,
  columnas: [
    { titulo: 'Nombre', celda: (g) => g.nombre },
    { titulo: 'Estado', celda: (g) => insigniaEstado(g.estado) },
    { titulo: 'Descripción', celda: (g) => textoOpcional(g.descripcion) },
    { titulo: 'Creado', celda: (g) => formatearFecha(g.createdAt) },
    { titulo: 'Actualizado', celda: (g) => formatearFecha(g.updatedAt) }
  ]
});
