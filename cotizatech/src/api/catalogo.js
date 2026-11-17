import { api, query } from './cliente.js'

// Catálogo de productos (cualquier usuario con sesión)
export const productosApi = {
  listar: (filtros) => api.get(`/productos${query(filtros)}`),
  obtener: (id) => api.get(`/productos/${id}`),
}

// Carrito del comprador: cada respuesta trae el carrito completo { items, cantidad, total_usd }
export const carritoApi = {
  obtener: () => api.get('/carrito'),
  agregar: (productoId) => api.post('/carrito', { producto_id: productoId }),
  cambiarCantidad: (productoId, delta) => api.patch(`/carrito/${productoId}`, { delta }),
  quitar: (productoId) => api.del(`/carrito/${productoId}`),
}
