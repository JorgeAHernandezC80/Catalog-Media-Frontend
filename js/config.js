// Configuración del frontend.
// Es el ÚNICO lugar donde se escribe la dirección de la API.
// La dirección se elige según dónde se abra la página:
// - en tu PC (Live Server: localhost o 127.0.0.1) se usa el backend local;
// - publicada (Netlify) se usa el backend en Render.
// Ninguna de las dos lleva "/" al final.
const API_LOCAL = 'http://localhost:5000/api/v1';
const API_PUBLICA = 'https://catalog-media-api-rest.onrender.com/api/v1';

const esLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_URL = esLocal ? API_LOCAL : API_PUBLICA;

// Máximo de géneros por producción. Debe coincidir con el backend (modelo Media).
export const MAX_GENEROS = 5;