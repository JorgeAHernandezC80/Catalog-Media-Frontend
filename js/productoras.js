import { iniciarCrud } from './crud.js';
import { formatearFecha, insigniaEstado, textoOpcional } from './ui.js';

iniciarCrud({
  recurso: 'productoras',
  singular: 'productora',
  articulo: 'la',
  nombreDe: (p) => p.nombre,
  columnas: [
    { titulo: 'Nombre', celda: (p) => p.nombre },
    { titulo: 'Estado', celda: (p) => insigniaEstado(p.estado) },
    { titulo: 'Eslogan', celda: (p) => textoOpcional(p.eslogan) },
    { titulo: 'Descripción', celda: (p) => textoOpcional(p.descripcion) },
    { titulo: 'Creado', celda: (p) => formatearFecha(p.createdAt) },
    { titulo: 'Actualizado', celda: (p) => formatearFecha(p.updatedAt) }
  ]
});
