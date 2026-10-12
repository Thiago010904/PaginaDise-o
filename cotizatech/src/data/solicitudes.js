import { productos } from './productos.js'

export const TRM = 4000 // COP por USD, para convertir los precios del catálogo
export const IVA = 0.19
export const LIMITE_DESCUENTO = 15 // % máximo permitido por las directrices de margen
export const ESTADOS_SOLICITUD = ['Por Cotizar', 'Borrador', 'Enviada', 'Aprobada', 'Rechazada']

export const NOTAS_DEFAULT = `1. Tiempos de entrega: 8 a 15 días hábiles a partir de la orden de compra.
2. Garantía de hardware provista por el fabricante oficial.
3. Forma de pago: Crédito corporativo a 30 días neto posterior a la facturación de servicios.
4. Precios cotizados no incluyen impuestos fuera de IVA.`

export const fmtCOP = (n) => `$ ${Math.round(n).toLocaleString('es-CO')}`
export const fmtMillones = (n) => `$${(n / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 })}M`

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export const fmtFechaCorta = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${d} ${MESES[Number(m) - 1]} ${y}`
}

// Resumen tipo "40x Lenovo ThinkPad L14, 2x Dell PowerEdge R760"
export const resumen = (s) => s.items.map((i) => `${i.qty}x ${i.nombre}`).join(', ')

// Subtotal, descuentos, IVA y total neto de una solicitud (en COP)
export const calcularSolicitud = (s) => {
  const lineas = s.items.map((i) => {
    const bruto = i.qty * i.precio
    const desc = (bruto * i.descuento) / 100
    return { ...i, bruto, desc, subtotal: bruto - desc }
  })
  const subtotal = lineas.reduce((a, l) => a + l.bruto, 0)
  const descuentos = lineas.reduce((a, l) => a + l.desc, 0)
  const iva = (subtotal - descuentos) * IVA
  return { lineas, subtotal, descuentos, iva, total: subtotal - descuentos + iva }
}

// Agrupa las solicitudes por cliente (NIT), ordenados por valor cotizado
export const agruparClientes = (solicitudes) => {
  const mapa = new Map()
  solicitudes.forEach((s) => {
    const c = mapa.get(s.cliente.nit) || { ...s.cliente, solicitudes: 0, aprobadas: 0, valor: 0, ultima: s.fecha }
    c.solicitudes += 1
    if (s.estado !== 'Rechazada') c.valor += calcularSolicitud(s).total
    if (s.estado === 'Aprobada') c.aprobadas += 1
    if (s.fecha > c.ultima) c.ultima = s.fecha
    mapa.set(s.cliente.nit, c)
  })
  return [...mapa.values()].sort((a, b) => b.valor - a.valor)
}

export const SECTORES = ['Tecnología', 'Banca y Finanzas', 'Retail / E-commerce', 'Salud', 'Educación', 'Manufactura', 'Energía', 'Gobierno', 'Logística', 'Otro']

// Convierte un producto del catálogo (USD) en un ítem de cotización (COP)
export const itemDesdeProducto = (p, qty = 1) => ({ id: `p${p.id}-${Date.now()}`, nombre: p.nombre, desc: p.desc, qty, precio: p.precio * TRM, descuento: 0 })

export const CLIENTES = {
  meli: { nombre: 'MercadoLibre Colombia S.A.S.', corto: 'MercadoLibre Colombia', nit: '900.234.129-2', contacto: 'Carlos Mendoza', email: 'cmendoza@mercadolibre.com.co', direccion: 'Avenida El Dorado #103-60', ciudad: 'Bogotá D.C., Colombia', sector: 'E-commerce' },
  rappi: { nombre: 'Rappi Colombia S.A.S.', corto: 'Rappi Colombia S.A.S.', nit: '830.012.332-1', contacto: 'Laura Gómez', email: 'lgomez@rappi.com', direccion: 'Calle 93 #19-58', ciudad: 'Bogotá D.C., Colombia', sector: 'Tecnología' },
  bogota: { nombre: 'Banco de Bogotá S.A.', corto: 'Banco de Bogotá S.A.', nit: '860.002.964-4', contacto: 'Andrés Rincón', email: 'arincon@bancodebogota.com.co', direccion: 'Calle 36 #7-47', ciudad: 'Bogotá D.C., Colombia', sector: 'Banca' },
  nubank: { nombre: 'Nubank Colombia', corto: 'Nubank Colombia', nit: '901.442.128-5', contacto: 'Valentina Ruiz', email: 'vruiz@nubank.com.co', direccion: 'Carrera 7 #71-21', ciudad: 'Bogotá D.C., Colombia', sector: 'Fintech' },
  bancolombia: { nombre: 'Bancolombia S.A.', corto: 'Bancolombia S.A.', nit: '890.903.938-8', contacto: 'Juliana Restrepo', email: 'jrestrepo@bancolombia.com.co', direccion: 'Carrera 48 #26-85', ciudad: 'Medellín, Colombia', sector: 'Banca' },
  exito: { nombre: 'Almacenes Éxito S.A.', corto: 'Grupo Éxito', nit: '890.900.608-9', contacto: 'Felipe Arango', email: 'farango@grupo-exito.com', direccion: 'Carrera 48 #32B Sur-139', ciudad: 'Envigado, Colombia', sector: 'Retail' },
  avianca: { nombre: 'Avianca S.A.', corto: 'Avianca S.A.', nit: '890.100.577-6', contacto: 'Camila Herrera', email: 'cherrera@avianca.com', direccion: 'Avenida El Dorado #93-30', ciudad: 'Bogotá D.C., Colombia', sector: 'Aerolínea' },
  ecopetrol: { nombre: 'Ecopetrol S.A.', corto: 'Ecopetrol S.A.', nit: '899.999.068-1', contacto: 'Ricardo Peña', email: 'rpena@ecopetrol.com.co', direccion: 'Carrera 13 #36-24', ciudad: 'Bogotá D.C., Colombia', sector: 'Energía' },
  alpina: { nombre: 'Alpina Productos Alimenticios S.A.', corto: 'Alpina S.A.', nit: '860.025.900-2', contacto: 'Natalia Castro', email: 'ncastro@alpina.com', direccion: 'Km 3 Vía Briceño-Zipaquirá', ciudad: 'Sopó, Colombia', sector: 'Alimentos' },
  addi: { nombre: 'Addi Colombia S.A.S.', corto: 'Addi Colombia', nit: '901.324.876-3', contacto: 'Mateo Vargas', email: 'mvargas@addi.com', direccion: 'Calle 99 #10-19', ciudad: 'Bogotá D.C., Colombia', sector: 'Fintech' },
}

const it = (nombre, desc, qty, precio, descuento = 0) => ({ id: `${nombre}-${qty}`, nombre, desc, qty, precio, descuento })

// Solicitudes de cotización que llegan al asesor (las 4 primeras son las del Figma)
const base = [
  { id: 'SOL-1012', cliente: 'meli', fecha: '2026-10-24', estado: 'Por Cotizar', items: [
    it('Lenovo ThinkPad L14 Gen 4', 'Intel Core i7, 16GB RAM, 512GB SSD, Windows 11 Pro', 40, 4200000, 12),
    it('Servidores Dell PowerEdge R760', 'Intel Xeon Silver, 64GB RAM, RAID 5, Garantía 3 Años', 2, 28500000, 5),
    it('Access Point Aruba Instant On AP22', 'WiFi 6, Dual Band, MIMO 2x2, PoE Ready', 4, 850000),
  ] },
  { id: 'SOL-1011', cliente: 'rappi', fecha: '2026-10-23', estado: 'Borrador', items: [
    it('Licencias Microsoft 365 Business Premium', 'Suscripción anual por usuario, incluye Intune y Defender', 150, 95000, 8),
    it('Soporte Anual Especializado', 'Mesa de ayuda 24/7 y gestión de tenant M365', 1, 18000000),
  ] },
  { id: 'SOL-1010', cliente: 'bogota', fecha: '2026-10-22', estado: 'Por Cotizar', items: [
    it('Upgrade de Firewall Core IPS Cisco Firepower', 'Firepower 2140 en alta disponibilidad, 3 años de soporte', 2, 92000000),
    it('Licenciamiento Cisco Secure', 'Cisco Secure Endpoint para 1000 nodos, 1 año', 1000, 210000),
  ] },
  { id: 'SOL-1009', cliente: 'nubank', fecha: '2026-10-20', estado: 'Enviada', items: [
    it('Consultoría DevOps', '120 Horas / Mes - AWS Cloud Migration', 120, 380000, 5),
  ] },
  { id: 'SOL-1008', cliente: 'bancolombia', fecha: '2026-10-18', estado: 'Por Cotizar', items: [
    it('Dell Latitude 5440', 'Intel Core i7 13va Gen, 16GB RAM, 512GB SSD', 60, 4720000),
    it('Monitor Dell UltraSharp 27"', '4K UHD, Panel IPS, USB-C', 60, 1680000),
  ] },
  { id: 'SOL-1007', cliente: 'exito', fecha: '2026-10-17', estado: 'Por Cotizar', items: [
    it('UPS APC Smart-UPS 1500VA', 'Respaldo de energía con pantalla LCD', 35, 1520000),
    it('Cisco Catalyst 1000 8 Puertos', 'Switch Gigabit gestionable', 35, 1360000),
  ] },
  { id: 'SOL-1006', cliente: 'avianca', fecha: '2026-10-16', estado: 'Borrador', items: [
    it('Servidor HPE ProLiant DL380', 'Intel Xeon Silver 4314, 32GB RAM', 6, 9800000, 6),
    it('Veeam Backup Essentials', 'Respaldo para 5 cargas de trabajo, 1 año', 6, 1280000),
  ] },
  { id: 'SOL-1005', cliente: 'ecopetrol', fecha: '2026-10-15', estado: 'Por Cotizar', items: [
    it('Auditoría de seguridad TI', 'Pruebas de vulnerabilidades e informe ejecutivo', 1, 14000000),
    it('FortiClient EMS', 'Gestión de endpoints Zero Trust, 1 año', 800, 340000),
  ] },
  { id: 'SOL-1004', cliente: 'alpina', fecha: '2026-10-14', estado: 'Por Cotizar', items: [
    it('Lenovo ThinkCentre M70q', 'Mini PC Intel Core i5, 8GB RAM, 256GB SSD', 45, 3040000),
    it('Teclado Dell KB522', 'Teclado multimedia USB, español latinoamérica', 45, 140000),
  ] },
  { id: 'SOL-1003', cliente: 'addi', fecha: '2026-10-12', estado: 'Por Cotizar', items: [
    it('Migración a la nube', 'Diagnóstico, plan y ejecución de migración a AWS', 1, 11200000),
  ] },
  { id: 'SOL-1002', cliente: 'meli', fecha: '2026-10-10', estado: 'Por Cotizar', items: [
    it('Cableado estructurado Cat6', 'Instalación y certificación de puntos de red', 220, 152000),
  ] },
  { id: 'SOL-1001', cliente: 'rappi', fecha: '2026-10-08', estado: 'Por Cotizar', items: [
    it('Logitech MX Master 3S', 'Ratón inalámbrico de precisión', 120, 396000),
  ] },
  { id: 'SOL-0998', cliente: 'bancolombia', fecha: '2026-10-03', estado: 'Aprobada', items: [
    it('Windows Server 2022 Standard', 'Licencia perpetua 16 núcleos', 12, 4276000, 10),
    it('Soporte técnico mensual', 'Mesa de ayuda 8x5, 12 meses', 12, 1800000),
  ] },
  { id: 'SOL-0995', cliente: 'nubank', fecha: '2026-09-29', estado: 'Aprobada', items: [
    it('Dell Latitude 5440', 'Intel Core i7 13va Gen, 16GB RAM, 512GB SSD', 80, 4720000, 7),
  ] },
  { id: 'SOL-0991', cliente: 'exito', fecha: '2026-09-24', estado: 'Aprobada', items: [
    it('ESET PROTECT Advanced', 'Protección de endpoints, 1 año', 1500, 180000, 10),
  ] },
  { id: 'SOL-0987', cliente: 'avianca', fecha: '2026-09-19', estado: 'Rechazada', items: [
    it('Cisco Catalyst 9200L', 'Switch 24 puertos PoE+', 14, 4600000),
  ] },
]

export const solicitudesIniciales = base.map((s) => ({ ...s, cliente: CLIENTES[s.cliente], validez: 30, notas: NOTAS_DEFAULT }))

export { productos }
