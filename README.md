# PaginaDise-o — CotizaTech

Plataforma de cotizaciones de TI (React + Vite + Tailwind) construida a partir del diseño en Figma.

## Ejecutar

```bash
cd cotizatech
npm install
npm run dev
```

## Usuarios de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Comprador | alejandro.torres@empresa.com | Cotiza2026 |
| Asesor | asesor@cotizatech.com | Asesor2026 |

Los datos viven en memoria: al recargar la página se reinician.

## Pantallas (según el Figma)

```
src/pages/
  auth/       Login, Registro
  comprador/  Dashboard, Catalogo, Cotizaciones, CotizacionDetalle, Perfil
  asesor/     PanelAsesor, BandejaSolicitudes, CotizacionesAsesor, EditorCotizacion, Clientes, Reportes
```

- **Comprador**: arma la cotización desde el catálogo, la envía y luego aprueba o rechaza las propuestas.
- **Asesor**: recibe las solicitudes en la bandeja, las cotiza en el editor (precios en COP, descuento máximo 15%, IVA 19%) y las envía al cliente.
