# API de CotizaTech

Express 5 + SQLite (`node:sqlite`). Autenticación con JWT en cookie `httpOnly`.

## Arranque
```bash
npm install
npm run db:reset      # crea/rellena server/db/cotizatech.db  (borra lo anterior)
npm run api:dev       # API en http://localhost:3000  (se reinicia al guardar)
npm run dev           # front en http://localhost:5173  (reenvía /api al back)
npm test              # 23 pruebas automáticas (usan una base temporal)
```
Variables (opcionales en desarrollo): copia `.env.example` a `.env`.

## Convenciones
- Todo en `/api`, JSON. Errores: `{ "error": "mensaje en español", "campos"?: {...} }`.
- Códigos: `400` datos inválidos · `401` sin sesión · `403` rol incorrecto · `404` no existe · `409` conflicto de estado · `422` regla de negocio.
- Listas paginadas: `?pagina=1&por_pagina=8` → `{ items, total, pagina, por_pagina, conteos }`.
- Comprador: valores en **USD**. Asesor: valores en **COP**.

## Auth
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | `{email, password}` → `{user}` + cookie |
| POST | `/auth/registro` | datos de la empresa + representante + `terminos:true` → 201 |
| POST | `/auth/logout` | cierra sesión |
| GET | `/auth/me` | usuario en sesión |
| PATCH | `/auth/perfil` | (comprador) actualiza empresa y representante |

## Catálogo y carrito (comprador)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/productos?tipo=&sub=&q=` | catálogo (cualquier usuario con sesión) |
| GET | `/productos/:id` | un producto |
| GET | `/carrito` | `{items, cantidad, total_usd}` |
| POST | `/carrito` | `{producto_id}` agrega 1 unidad |
| PATCH | `/carrito/:productoId` | `{delta: 1 \| -1}` (en 0 se quita) |
| DELETE | `/carrito/:productoId` | quita el producto |

Todas las rutas del carrito devuelven el carrito completo actualizado.

## Cotizaciones (comprador)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/cotizaciones?estado=Pendiente` | historial propio (`conteos` por estado para los filtros) |
| GET | `/cotizaciones/resumen` | KPIs y actividad reciente del dashboard |
| POST | `/cotizaciones` | crea la solicitud con el carrito → `{folio}` |
| GET | `/cotizaciones/:folio` | detalle con líneas y totales en USD |
| POST | `/cotizaciones/:folio/decision` | `{decision: "Aprobada" \| "Rechazada"}` (solo si `puede_decidir`) |

## Asesor
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/asesor/panel` | KPIs + 4 solicitudes recientes |
| GET | `/asesor/solicitudes?estado=Borrador,Enviada&q=` | bandeja (el filtro `estado` acepta varios, separados por coma) |
| GET | `/asesor/solicitudes/:folio` | detalle para el editor |
| PUT | `/asesor/solicitudes/:folio` | guarda borrador `{items, notas, validez_dias}` |
| POST | `/asesor/solicitudes/:folio/enviar` | envía al cliente (cuerpo opcional: guarda y envía) |
| POST | `/asesor/solicitudes/:folio/rechazar` | rechaza |
| GET | `/asesor/clientes?q=` | resumen por cliente |
| GET | `/asesor/reportes` | por estado, KPIs, top 5 clientes |

## Ciclo de vida de una cotización
```
Por Cotizar ──(asesor guarda)──▶ Borrador ──(asesor envía)──▶ Enviada ──(comprador)──▶ Aprobada | Rechazada
                                                                 └──(pasa la validez)──▶ Vencida
```
El comprador ve `Por Cotizar`, `Borrador` y `Enviada` como **Pendiente**, pero solo puede aprobar/rechazar cuando está `Enviada`.
Al enviar se valida: descuento máximo (15%, configurable en la tabla `configuracion`), y que cada ítem tenga cantidad y precio.

Reglas que aplica el patrón State (`dominio/estados`):
- Una cotización **Enviada** ya no se edita ni la rechaza el asesor: está en manos del cliente (409).
- **Vencida (RN-03):** si pasa la validez, la cotización vence en el momento en que alguien la abre o intenta decidir,
  y los listados revisan vencimientos como máximo una vez por minuto. `AUTO_VENCER=true` además lo hace cada hora.

## Patrones GoF (Entregable 2 → implementados)
| Patrón | Archivo | Para qué |
|---|---|---|
| State | `dominio/estados/EstadoCotizacion.js` | Cada estado decide qué acción permite y a qué estado pasa |
| Strategy | `dominio/calculo/estrategias.js` | Políticas intercambiables de descuento (tope 15%) e impuesto (IVA) |
| Observer | `dominio/eventos/observadores.js` | Al cambiar de estado: historial en la base + correo (simulado) |
| Builder | `dominio/documento/DocumentoCotizacionBuilder.js` | Arma por partes el documento formal que ve el cliente |
| Facade | `services/CotizacionFacade.js` | Punto único que usan las rutas; coordina base de datos y los 4 patrones |

## Pruebas
`npm test` corre 23 pruebas: `auth`, `catalogo` y `cotizaciones` (API completa con base temporal)
y una por patrón (`estados`, `calculo`, `eventos`, `documento`).
