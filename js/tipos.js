import { iniciarCrud } from './crud.js';
import { formatearFecha, textoOpcional } from './ui.js';

// El Tipo (Película, Serie...) no tiene campo "estado" en el backend.
iniciarCrud({
  recurso: 'tipos',
  singular: 'tipo',
  articulo: 'el',
  nombreDe: (t) => t.nombre,
  columnas: [
    { titulo: 'Nombre', celda: (t) => t.nombre },
    { titulo: 'Descripción', celda: (t) => textoOpcional(t.descripcion) },
    { titulo: 'Creado', celda: (t) => formatearFecha(t.createdAt) },
    { titulo: 'Actualizado', celda: (t) => formatearFecha(t.updatedAt) }
  ]
});
