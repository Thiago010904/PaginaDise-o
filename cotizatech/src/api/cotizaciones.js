import { api, query } from './cliente.js'

// Cotizaciones del COMPRADOR (valores en USD)
export const cotizacionesApi = {
  listar: ({ estado, pagina, por_pagina } = {}) => api.get(`/cotizaciones${query({ estado, pagina, por_pagina })}`),
  resumen: () => api.get('/cotizaciones/resumen'),
  solicitar: () => api.post('/cotizaciones'),                       // crea la solicitud con el carrito
  obtener: (folio) => api.get(`/cotizaciones/${folio}`),
  decidir: (folio, decision) => api.post(`/cotizaciones/${folio}/decision`, { decision }),   // 'Aprobada' | 'Rechazada'
}
