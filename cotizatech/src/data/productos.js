import {
  Laptop, Database, Monitor, Network, MousePointer2, BatteryCharging, Keyboard,
  AppWindow, ShieldCheck, Cloud, Headset, Cable, ClipboardCheck, HardDrive,
} from 'lucide-react'

const OK = 'Stock Disponible'
const LIM = 'Stock Limitado'

export const productos = [
  // HARDWARE
  { id: 1, tab: 'Hardware', sub: 'Computadoras', marca: 'Lenovo', icon: Laptop, nombre: 'ThinkPad L14 Gen 4', desc: 'AMD Ryzen 5 PRO, 16GB RAM, 512GB SSD, Pantalla 14" FHD, Windows 11 Pro', precio: 899, stock: OK },
  { id: 2, tab: 'Hardware', sub: 'Servidores', marca: 'HPE', icon: Database, nombre: 'Servidor HPE ProLiant DL380', desc: 'Intel Xeon Silver 4314, 32GB RAM, Sin discos, Controladora Smart Array', precio: 2450, stock: OK },
  { id: 3, tab: 'Hardware', sub: 'Monitores', marca: 'Dell Technologies', icon: Monitor, nombre: 'Monitor Dell UltraSharp 27"', desc: 'Resolución 4K UHD, Panel IPS, Cobertura 99% sRGB, Conectividad USB-C', precio: 420, stock: OK },
  { id: 4, tab: 'Hardware', sub: 'Redes / Switches', marca: 'Cisco Systems', icon: Network, nombre: 'Cisco Catalyst 9200L', desc: 'Switch Gestionable de 24 Puertos PoE+, Capacidad de Enrutamiento L3', precio: 1150, stock: OK },
  { id: 5, tab: 'Hardware', sub: 'Periféricos', marca: 'Logitech', icon: MousePointer2, nombre: 'Logitech MX Master 3S', desc: 'Ratón Inalámbrico de Precisión, Conexión Multidispositivo, Sensor 8K DPI', precio: 99, stock: OK },
  { id: 6, tab: 'Hardware', sub: 'Periféricos', marca: 'APC', icon: BatteryCharging, nombre: 'UPS APC Smart-UPS 1500VA', desc: 'Respaldo de Energía Inteligente con Pantalla LCD, Salidas Protegidas', precio: 380, stock: OK },
  { id: 7, tab: 'Hardware', sub: 'Computadoras', marca: 'Dell Technologies', icon: Laptop, nombre: 'Dell Latitude 5440', desc: 'Intel Core i7 13va Gen, 16GB RAM, 512GB SSD, Pantalla 14" FHD', precio: 1180, stock: OK },
  { id: 8, tab: 'Hardware', sub: 'Computadoras', marca: 'Lenovo', icon: Laptop, nombre: 'Lenovo ThinkCentre M70q', desc: 'Mini PC Intel Core i5, 8GB RAM, 256GB SSD, Windows 11 Pro', precio: 760, stock: LIM },
  { id: 9, tab: 'Hardware', sub: 'Servidores', marca: 'HPE', icon: Database, nombre: 'HPE ProLiant ML30 Gen10 Plus', desc: 'Servidor Torre Intel Xeon E-2314, 16GB RAM, Fuente Redundante Opcional', precio: 1490, stock: LIM },
  { id: 10, tab: 'Hardware', sub: 'Redes / Switches', marca: 'Cisco Systems', icon: Network, nombre: 'Cisco Catalyst 1000 8 Puertos', desc: 'Switch Gigabit Gestionable, 8 Puertos, 2 Uplinks SFP', precio: 340, stock: OK },
  { id: 11, tab: 'Hardware', sub: 'Periféricos', marca: 'Dell Technologies', icon: Keyboard, nombre: 'Teclado Dell KB522', desc: 'Teclado Multimedia con Cable USB, Distribución Español Latinoamérica', precio: 35, stock: OK },

  // SOFTWARE
  { id: 12, tab: 'Software', sub: 'Licencias', marca: 'Microsoft', icon: AppWindow, nombre: 'Microsoft 365 Business Standard', desc: 'Apps de Office, Teams, 1TB en OneDrive y correo corporativo', precio: 12.5, unidad: '/usuario/mes', stock: OK },
  { id: 13, tab: 'Software', sub: 'Licencias', marca: 'Microsoft', icon: AppWindow, nombre: 'Windows Server 2022 Standard', desc: 'Licencia perpetua para 16 núcleos, incluye 2 máquinas virtuales', precio: 1069, stock: OK },
  { id: 14, tab: 'Software', sub: 'Seguridad', marca: 'ESET', icon: ShieldCheck, nombre: 'ESET PROTECT Advanced', desc: 'Protección de endpoints con cifrado de disco y consola en la nube', precio: 45, unidad: '/licencia/año', stock: OK },
  { id: 15, tab: 'Software', sub: 'Seguridad', marca: 'Fortinet', icon: ShieldCheck, nombre: 'FortiClient EMS', desc: 'Gestión centralizada de endpoints con acceso Zero Trust', precio: 85, unidad: '/licencia/año', stock: LIM },
  { id: 16, tab: 'Software', sub: 'Respaldo', marca: 'Veeam', icon: HardDrive, nombre: 'Veeam Backup Essentials', desc: 'Respaldo y recuperación para entornos virtuales y físicos, 5 cargas de trabajo', precio: 320, unidad: '/año', stock: OK },

  // SERVICIOS
  { id: 17, tab: 'Servicios', sub: 'Soporte', marca: 'Partner certificado', icon: Headset, nombre: 'Soporte técnico mensual', desc: 'Mesa de ayuda 8x5, atención remota y visitas on-site por incidente', precio: 450, unidad: '/mes', stock: 'Disponible' },
  { id: 18, tab: 'Servicios', sub: 'Instalación', marca: 'Partner certificado', icon: Cable, nombre: 'Cableado estructurado Cat6', desc: 'Instalación, certificación y rotulado de puntos de red', precio: 38, unidad: '/punto', stock: 'Disponible' },
  { id: 19, tab: 'Servicios', sub: 'Consultoría', marca: 'Partner certificado', icon: Cloud, nombre: 'Migración a la nube', desc: 'Diagnóstico, plan y ejecución de migración de cargas a Azure o AWS', precio: 2800, unidad: '/proyecto', stock: 'Disponible' },
  { id: 20, tab: 'Servicios', sub: 'Consultoría', marca: 'Partner certificado', icon: ClipboardCheck, nombre: 'Auditoría de seguridad TI', desc: 'Pruebas de vulnerabilidades, informe ejecutivo y plan de remediación', precio: 3500, unidad: '/proyecto', stock: 'Cupos Limitados' },
]