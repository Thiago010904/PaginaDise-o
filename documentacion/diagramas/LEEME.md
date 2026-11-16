# Diagramas UML — CotizaTech (Entregable 3)

Cada diagrama tiene su imagen (`.png`) y su archivo editable (`.puml`). Para editarlo: copiar el contenido del `.puml` en [PlantText](https://www.planttext.com) o usar la extensión PlantUML de VS Code.

| Punto del Entregable 3 | Diagrama | Archivos |
|---|---|---|
| 2. Máquina de estados | Ciclo de vida de la Cotización | `maquina-estados.puml` / `.png` |
| 3. Componentes | Organización modular front / back / base | `componentes.puml` / `.png` |
| 3. Despliegue | Nodos, artefactos y protocolos | `despliegue.puml` / `.png` |
| 4. Secuencia | Inicio de sesión | `secuencia-01-inicio-sesion.puml` / `.png` |
| 4. Secuencia | Enviar solicitud de cotización | `secuencia-02-solicitud.puml` / `.png` |
| 4. Secuencia | El asesor envía la cotización | `secuencia-03-envio-asesor.puml` / `.png` |
| 4. Secuencia | El comprador aprueba la cotización | `secuencia-04-decision-comprador.puml` / `.png` |

> Las **épicas** de los diagramas de secuencia agrupan las historias HU-01 a HU-08 del Entregable 2. Si en el story mapping del Entregable 1 las épicas tienen otro nombre, basta con cambiar el título en el `.puml`.

---

## Máquina de estados: Cotización

**Entidad:** `Cotización` (tabla `cotizaciones`). Se eligió porque su comportamiento cambia según el estado: lo que el asesor y el comprador pueden hacer depende de en qué punto del ciclo está. En el código se implementa con el **patrón State** (`server/dominio/estados/EstadoCotizacion.js`): una clase por estado decide qué transición permite; las no permitidas responden **409**.

- **Estado inicial:** Por Cotizar (al enviar la solicitud desde el carrito).
- **Estados intermedios:** Borrador, Enviada.
- **Estados finales:** Aprobada, Rechazada, Vencida.

### Matriz de análisis

| Estado origen | Evento | Condición de guarda | Acción | Estado destino | Regla / HU |
|---|---|---|---|---|---|
| (inicio) | `solicitar()` (comprador) | carrito no vacío | asignar folio, copiar ítems con precio USD×TRM, vaciar carrito, registrar historial | Por Cotizar | RF-05 · HU-03 |
| Por Cotizar | `guardar()` (asesor) | datos válidos (≥1 ítem, cantidad ≥1) | reemplazar ítems, notas y validez | Borrador | RF-06 · HU-07 |
| Borrador | `guardar()` (asesor) | datos válidos | reemplazar ítems, notas y validez | Borrador | HU-07 |
| Por Cotizar / Borrador | `enviar()` (asesor) | descuentos ≤ 15% y cada ítem con cantidad y precio | fecha_envio = hoy, correo al cliente (simulado), historial | Enviada | RN-01, RN-02 · HU-08 |
| Por Cotizar / Borrador | `rechazarPorAsesor()` | — | historial | Rechazada | HU-06 |
| Enviada | `decidir("Aprobada")` (comprador) | es su cotización y sigue vigente | correo al asesor (simulado), historial | Aprobada | RF-08 · HU-05 |
| Enviada | `decidir("Rechazada")` (comprador) | es su cotización y sigue vigente | historial | Rechazada | RF-08 · HU-05 |
| Enviada | `vencer()` (sistema) | hoy > fecha_envio + validez_dias | correo al cliente (simulado), historial | Vencida | RN-03 |
| Enviada | `guardar()` / `enviar()` / `rechazarPorAsesor()` | — | **409**: ya está en manos del cliente | (sin cambio) | — |
| Por Cotizar / Borrador | `decidir()` | — | **409**: aún no está lista | (sin cambio) | — |
| Aprobada / Rechazada / Vencida | cualquier acción | — | **409** | (sin cambio) | — |

### Relación con el MVP
- El comprador ve *Por Cotizar*, *Borrador* y *Enviada* como **Pendiente** (`vistaComprador`), pero solo puede aprobar o rechazar en *Enviada* (`puedeDecidir`).
- El editor del asesor queda en solo lectura cuando el estado no es editable (`editable`), y el botón "Aprobar" del comprador solo aparece si `puede_decidir`.
- Cada transición pasa por `CotizacionFacade`, que la guarda y publica el evento; `HistorialObserver` la registra en `cotizacion_historial` con el usuario que la hizo.
- El vencimiento se aplica al abrir o intentar decidir la cotización, en los listados (como máximo una vez por minuto) y, si `AUTO_VENCER=true`, cada hora.

---

## Diagramas de secuencia

### 1. Inicio de sesión
- **Épica:** Acceso y cuenta · **HU-01** (RU-01, RF-01)
- **Actor:** comprador o asesor · **Participantes:** `Login.jsx`, `AuthContext`, `authApi`, limitador de intentos, `routes/auth.js`, `passwords.js`, SQLite.
- **Flujo principal:** valida con Zod, busca el usuario, compara la contraseña con scrypt en tiempo constante, firma un JWT y lo guarda en una cookie `httpOnly`; el front redirige según el rol.
- **Flujos alternativos:** campos vacíos (lo detiene el front), credenciales incorrectas o usuario inactivo (**401**, mismo mensaje para no revelar qué correos existen), más de 10 intentos en 15 minutos (**429**).

### 2. Enviar solicitud de cotización
- **Épica:** Catálogo y solicitud · **HU-02, HU-03** (RU-02, RU-03, RF-05)
- **Actor:** comprador · **Participantes:** `Layout.jsx`, `CotizacionesContext`, `cotizacionesApi`, middleware `autenticar`/`requerirRol`, `routes/cotizaciones.js`, `CotizacionFacade`, `PublicadorEventos`, `HistorialObserver`, SQLite.
- **Flujo principal:** en una transacción lee el carrito, genera el folio, crea la cotización *Por Cotizar* con sus ítems (precio en COP = USD × TRM), vacía el carrito y publica el evento que queda en el historial.
- **Flujos alternativos:** sin sesión (**401** y vuelta al login), rol incorrecto (**403**), carrito vacío (**400**, `ROLLBACK`).
- **Patrones:** Facade, Observer.

### 3. El asesor envía la cotización
- **Épica:** Gestión y elaboración de cotizaciones · **HU-06, HU-07, HU-08** (RU-07, RU-08, RF-06, RF-07, RF-09, RN-01, RN-02)
- **Actor:** asesor · **Participantes:** `EditorCotizacion.jsx`, `asesorApi`, `routes/asesor.js`, `CotizacionFacade`, `EstadoCotizacion`, `CalculadoraCotizacion`, `PublicadorEventos`, `HistorialObserver`, `NotificacionCorreoObserver`, SQLite.
- **Flujo principal:** valida el cuerpo, el estado permite enviar, guarda los ítems, la estrategia de descuento confirma que nada supera el 15%, cambia a *Enviada*, registra historial y correo simulado; devuelve los totales calculados con la estrategia de IVA.
- **Flujos alternativos:** datos inválidos (**400**), folio inexistente (**404**), estado que no permite enviar (**409**), descuento mayor al 15% (**422** con los ítems a corregir y `ROLLBACK`), ítem sin cantidad o precio (**422**).
- **Patrones:** Facade, State, Strategy, Observer.

### 4. El comprador aprueba la cotización
- **Épica:** Seguimiento y decisión · **HU-04, HU-05** (RU-04, RU-05, RF-08, RN-03)
- **Actor:** comprador · **Participantes:** `CotizacionDetalle.jsx`, `cotizacionesApi`, `routes/cotizaciones.js`, `CotizacionFacade`, `EstadoCotizacion`, `PublicadorEventos`, `DocumentoCotizacionBuilder`, SQLite.
- **Flujo principal:** el detalle se arma con el Builder; al aprobar, el estado *Enviada* permite la decisión, se guarda *Aprobada*, se registra historial y aviso al asesor.
- **Flujos alternativos:** cotización ajena o inexistente (**404**); vencida (primero pasa a *Vencida* y se confirma, luego **409** "venció"); todavía en preparación o ya decidida (**409**).
- **Patrones:** Facade, State, Observer, Builder.
