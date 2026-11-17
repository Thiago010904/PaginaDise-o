// Cliente HTTP único para hablar con el back (/api).
// En desarrollo Vite reenvía /api a http://localhost:3000 (ver vite.config.js),
// así la cookie de sesión funciona sin configurar CORS.

export class ApiError extends Error {
  constructor(status, mensaje, datos) {
    super(mensaje)
    this.status = status
    this.datos = datos
  }
}

// Avisa a la app cuando el back responde 401 (sesión vencida) para volver al login
export const SESION_EXPIRADA = 'cotizatech:sesion-expirada'

async function pedir(metodo, ruta, body) {
  let r
  try {
    r = await fetch(`/api${ruta}`, {
      method: metodo,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor. Verifica que la API esté encendida (npm run api:dev).')
  }
  const datos = await r.json().catch(() => null)
  if (!r.ok) {
    if (r.status === 401 && ruta !== '/auth/login' && ruta !== '/auth/me') window.dispatchEvent(new Event(SESION_EXPIRADA))
    throw new ApiError(r.status, datos?.error || 'Ocurrió un error inesperado.', datos)
  }
  return datos
}

// Convierte { estado: 'Pendiente', pagina: 2 } en "?estado=Pendiente&pagina=2" (omite vacíos)
export const query = (params = {}) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
  return q.size ? `?${q}` : ''
}

export const api = {
  get: (ruta) => pedir('GET', ruta),
  post: (ruta, body = {}) => pedir('POST', ruta, body),
  put: (ruta, body) => pedir('PUT', ruta, body),
  patch: (ruta, body) => pedir('PATCH', ruta, body),
  del: (ruta) => pedir('DELETE', ruta),
}
