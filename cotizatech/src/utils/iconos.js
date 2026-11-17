import {
  Laptop, Database, Monitor, Network, MousePointer2, BatteryCharging, Keyboard,
  AppWindow, ShieldCheck, Cloud, Headset, Cable, ClipboardCheck, HardDrive, Package,
} from 'lucide-react'

// La base guarda el icono de cada producto por su nombre (columna "icono")
const ICONOS = { Laptop, Database, Monitor, Network, MousePointer2, BatteryCharging, Keyboard, AppWindow, ShieldCheck, Cloud, Headset, Cable, ClipboardCheck, HardDrive }

export const iconoProducto = (nombre) => ICONOS[nombre] || Package
