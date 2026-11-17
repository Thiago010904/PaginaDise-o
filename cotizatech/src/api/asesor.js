import { api, query } from './cliente.js'

// Panel del ASESOR (valores en COP)
export const asesorApi = {
  panel: () => api.get('/asesor/panel'),
  // estado acepta varios separados por coma: 'Borrador,Enviada'
  solicitudes: ({ estado, q, pagina, por_pagina } = {}) => api.get(`/asesor/solicitudes${query({ estado, q, pagina, por_pagina })}`),
  solicitud: (folio) => api.get(`/asesor/solicitudes/${folio}`),
  guardarBorrador: (folio, datos) => api.put(`/asesor/solicitudes/${folio}`, datos),
  enviar: (folio, datos) => api.post(`/asesor/solicitudes/${folio}/enviar`, datos),
  rechazar: (folio) => api.post(`/asesor/solicitudes/${folio}/rechazar`),
  clientes: (q) => api.get(`/asesor/clientes${query({ q })}`),
  reportes: () => api.get('/asesor/reportes'),
}
