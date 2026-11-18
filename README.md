# CotizaTech — Sistema de Cotización de Servicios de Hardware y Software

Plataforma web B2B para el ciclo de cotización de tecnología: el **comprador** (cliente empresarial) arma su solicitud desde un catálogo, el **asesor** la cotiza aplicando las reglas comerciales (descuento máximo 15%, IVA 19%) y el comprador aprueba o rechaza la propuesta.

Proyecto del curso **Diseño de Sistemas de Información** (ITM) — Docente: Alexandra Guerrero Bocanegra.

## Integrantes
- Juan David Arias Ospina
- Edwin Esteban Arias Escobar
- Santiago Quintero Grisales
- Andrés Felipe Jaramillo Betancur
- Sebastián Araque Restrepo

## Tecnologías
| Capa | Tecnología |
|---|---|
| Frontend | React 19, React Router 7, Vite 8, Tailwind CSS 4, lucide-react |
| Backend | Node.js 22.13+, Express 5, Zod (validación), JSON Web Token en cookie httpOnly, Helmet, express-rate-limit |
| Base de datos | SQLite (módulo `node:sqlite` integrado en Node, sin instalar nada aparte) |
| Pruebas | `node:test` (23 pruebas automáticas) |
| Diagramas | PlantUML |

## Arquitectura general
```
Navegador (React SPA) ──fetch /api (JSON, cookie JWT)──▶ API Express ──▶ CotizacionFacade ──▶ SQLite
                                                              │                │
                                                         middleware      State · Strategy ·
                                                      (auth, roles,      Observer · Builder
                                                        errores)
```
- **Frontend** (`cotizatech/src`): páginas por rol, `src/api/*` (un módulo por recurso), hook `useApi` para carga y errores, contextos de sesión y carrito.
- **Backend** (`cotizatech/server`): rutas REST, middleware de autenticación y roles, `services/CotizacionFacade.js` y la carpeta `dominio/` con los patrones GoF.
- **Base de datos** (`server/db/schema.sql`): tablas, vistas de totales y triggers.

Diagramas UML (imagen + archivo editable), en la rama [`docs/diagrama-componentes`](https://github.com/Thiago010904/PaginaDise-o/tree/docs/diagrama-componentes/documentacion/diagramas):
- Componentes: [imagen](https://github.com/Thiago010904/PaginaDise-o/blob/docs/diagrama-componentes/documentacion/diagramas/componentes.png) · [editable .puml](https://github.com/Thiago010904/PaginaDise-o/blob/docs/diagrama-componentes/documentacion/diagramas/componentes.puml)
- Despliegue: [imagen](https://github.com/Thiago010904/PaginaDise-o/blob/docs/diagrama-componentes/documentacion/diagramas/despliegue.png) · [editable .puml](https://github.com/Thiago010904/PaginaDise-o/blob/docs/diagrama-componentes/documentacion/diagramas/despliegue.puml)

### Patrones de diseño GoF aplicados
| Patrón | Dónde | Problema que resuelve |
|---|---|---|
| State | `server/dominio/estados/EstadoCotizacion.js` | Las acciones permitidas dependen del estado (no se aprueba un borrador, no se edita lo enviado) |
| Strategy | `server/dominio/calculo/estrategias.js` | Descuento (tope 15%, RN-01) e IVA como políticas intercambiables |
| Observer | `server/dominio/eventos/observadores.js` | Cada cambio de estado queda en el historial y genera el aviso por correo (simulado) |
| Builder | `server/dominio/documento/DocumentoCotizacionBuilder.js` | El documento formal para el cliente se arma por partes y se valida |
| Facade | `server/services/CotizacionFacade.js` | Las rutas usan una sola clase que coordina base de datos y patrones |

## Funcionalidades implementadas
**Comprador:** registro e inicio de sesión · catálogo con filtros y búsqueda · carrito persistente · envío de la solicitud · historial con filtros y paginación · detalle de la cotización y descarga en PDF · aprobar o rechazar · perfil de la empresa.

**Asesor:** panel con indicadores · bandeja de solicitudes con filtros, búsqueda y paginación · editor de cotización (ítems, descuentos, notas, validez) · guardar borrador y enviar al cliente · rechazar · clientes · reportes de ventas.

### Flujos alternativos y validaciones (verificables)
| Situación | Respuesta del sistema |
|---|---|
| Correo o contraseña incorrectos / demasiados intentos | 401 / 429 con mensaje |
| Registro con correo repetido, NIT de otra empresa, contraseña corta o sin aceptar términos | 409 / 400 con mensaje |
| Enviar la solicitud con el carrito vacío | 400 |
| Asesor envía con un descuento mayor a 15% | 422 y se indica qué ítem (RN-01) |
| Ítem sin cantidad o precio | 400 / 422 |
| Editar o rechazar una cotización ya enviada, aprobada o rechazada | 409 (patrón State) |
| Aprobar una cotización vencida | 409 y pasa a **Vencida** (RN-03) |
| Comprador intenta ver o decidir la cotización de otra empresa | 404 |
| Usuario sin sesión o con el rol equivocado | 401 / 403 |
| La API está apagada | El front muestra "No pudimos conectar con el servidor" |

## Requisitos de instalación
- **Node.js 22.13 o superior** (incluye `node:sqlite`). Verifica con `node -v`.
- npm 10+ y Git.

## Configuración del entorno
Opcional en desarrollo. Copia `cotizatech/.env.example` a `cotizatech/.env`:
| Variable | Uso |
|---|---|
| `PORT` | Puerto de la API (por defecto 3000) |
| `JWT_SECRET` | Obligatoria en producción |
| `AUTO_VENCER` | `true` revisa vencimientos cada hora |

## Cómo ejecutar
```bash
cd cotizatech
npm install
npm run db:reset    # crea server/db/cotizatech.db con datos de ejemplo (borra la anterior)
npm run api:dev     # backend en http://localhost:3000
```
En otra terminal:
```bash
cd cotizatech
npm run dev         # frontend en http://localhost:5173 (reenvía /api al backend)
```
Pruebas automáticas: `npm test` · Producción: `npm run build` y luego `NODE_ENV=production npm run api` (Express entrega el front y la API en el mismo puerto).

### Usuarios de prueba
| Rol | Correo | Contraseña |
|---|---|---|
| Comprador | alejandro.torres@empresa.com | Cotiza2026 |
| Asesor | asesor@cotizatech.com | Asesor2026 |

## Despliegue
El MVP se ejecuta localmente (no hay despliegue público). El diagrama de despliegue muestra cómo se distribuye.

## Documentación técnica
- API, ciclo de vida y patrones: [cotizatech/server/README.md](cotizatech/server/README.md)
- Esquema de base de datos: [cotizatech/server/db/schema.sql](cotizatech/server/db/schema.sql)
- Diagramas UML: rama [`docs/diagrama-componentes`](https://github.com/Thiago010904/PaginaDise-o/tree/docs/diagrama-componentes/documentacion/diagramas)

## Evidencias del MVP
Las capturas de los flujos principales y alternativos se encuentran en el documento del Entregable 3 (sección Anexos).

## Uso de inteligencia artificial
Durante el desarrollo se usaron herramientas de IA como apoyo para revisar código, proponer la integración frontend–backend y elaborar diagramas. El análisis, las decisiones de diseño y la validación son responsabilidad del equipo.
