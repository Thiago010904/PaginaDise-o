-- ============================================================
--  CotizaTech · Esquema SQLite
--  Dinero: COP en INTEGER (pesos), catálogo en USD (REAL).
--  Fechas: TEXT ISO 'YYYY-MM-DD' (igual que el front).
-- ============================================================
PRAGMA foreign_keys = ON;

-- ---------- Configuración global (reglas de negocio) ----------
CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

-- ---------- Empresas (clientes / compradores) ----------
CREATE TABLE IF NOT EXISTS empresas (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre     TEXT NOT NULL,
  nombre_corto TEXT,
  nit        TEXT NOT NULL UNIQUE,
  sector     TEXT,
  direccion  TEXT,
  ciudad     TEXT,
  pais       TEXT NOT NULL DEFAULT 'Colombia',
  telefono   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- Usuarios (compradores y asesores) ----------
-- password_hash NULL = contacto sin acceso (no puede iniciar sesión).
CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT,
  nombre        TEXT NOT NULL,
  cargo         TEXT,
  rol           TEXT NOT NULL CHECK (rol IN ('comprador','asesor')),
  empresa_id    INTEGER REFERENCES empresas(id) ON DELETE SET NULL,
  activo        INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  -- Todo comprador pertenece a una empresa
  CHECK (rol = 'asesor' OR empresa_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON usuarios(empresa_id);

-- ---------- Catálogo de productos ----------
CREATE TABLE IF NOT EXISTS productos (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo         TEXT NOT NULL CHECK (tipo IN ('Hardware','Software','Servicios')),  -- "tab" del front
  subcategoria TEXT NOT NULL,                                                      -- "sub" del front
  marca        TEXT NOT NULL,
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  precio_usd   REAL NOT NULL CHECK (precio_usd >= 0),
  unidad       TEXT,                    -- '/usuario/mes', '/proyecto'... NULL = pago único
  disponibilidad TEXT NOT NULL,         -- 'Stock Disponible', 'Stock Limitado', 'Cupos Limitados'...
  icono        TEXT,                    -- nombre del icono de lucide-react
  activo       INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1))
);
CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos(tipo, subcategoria);

-- ---------- Carrito persistente del comprador ----------
CREATE TABLE IF NOT EXISTS carrito_items (
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad    INTEGER NOT NULL CHECK (cantidad > 0),
  PRIMARY KEY (usuario_id, producto_id)
);

-- ---------- Cotizaciones (unifica "cotizaciones" y "solicitudes" del front) ----------
CREATE TABLE IF NOT EXISTS cotizaciones (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  folio              TEXT NOT NULL UNIQUE,                 -- 'COT-00126', 'SOL-1012'
  empresa_id         INTEGER NOT NULL REFERENCES empresas(id),
  solicitante_id     INTEGER NOT NULL REFERENCES usuarios(id),   -- comprador / contacto
  asesor_id          INTEGER REFERENCES usuarios(id),            -- NULL = sin asignar
  estado             TEXT NOT NULL DEFAULT 'Por Cotizar'
                     CHECK (estado IN ('Por Cotizar','Borrador','Enviada','Aprobada','Rechazada','Vencida')),
  fecha_solicitud    TEXT NOT NULL,
  fecha_envio        TEXT,                                 -- cuando el asesor la envía al cliente
  validez_dias       INTEGER NOT NULL DEFAULT 30 CHECK (validez_dias > 0),
  notas              TEXT,
  descuento_adicional INTEGER NOT NULL DEFAULT 0 CHECK (descuento_adicional >= 0),  -- COP, descuento global
  iva_pct            REAL NOT NULL DEFAULT 19,             -- snapshot al crear
  trm                REAL NOT NULL DEFAULT 4000,           -- COP por USD, snapshot al crear
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cot_empresa     ON cotizaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cot_solicitante ON cotizaciones(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_cot_estado      ON cotizaciones(estado);
CREATE INDEX IF NOT EXISTS idx_cot_fecha       ON cotizaciones(fecha_solicitud);

-- ---------- Ítems de cada cotización (precio "congelado" en COP) ----------
CREATE TABLE IF NOT EXISTS cotizacion_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  cotizacion_id   INTEGER NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  producto_id     INTEGER REFERENCES productos(id) ON DELETE SET NULL,  -- NULL = ítem personalizado
  orden           INTEGER NOT NULL DEFAULT 0,
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario INTEGER NOT NULL CHECK (precio_unitario >= 0),        -- COP
  descuento_pct   REAL NOT NULL DEFAULT 0 CHECK (descuento_pct BETWEEN 0 AND 100)
);
CREATE INDEX IF NOT EXISTS idx_items_cotizacion ON cotizacion_items(cotizacion_id);

-- ---------- Historial de cambios de estado ----------
CREATE TABLE IF NOT EXISTS cotizacion_historial (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  cotizacion_id   INTEGER NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  estado_anterior TEXT,
  estado_nuevo    TEXT NOT NULL,
  usuario_id      INTEGER REFERENCES usuarios(id),   -- el back puede completarlo
  fecha           TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_hist_cotizacion ON cotizacion_historial(cotizacion_id);

-- ============================================================
--  TRIGGERS
-- ============================================================

-- Mantiene updated_at
CREATE TRIGGER IF NOT EXISTS trg_cot_updated_at
AFTER UPDATE ON cotizaciones
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE cotizaciones SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Registra cada cambio de estado
CREATE TRIGGER IF NOT EXISTS trg_cot_historial
AFTER UPDATE OF estado ON cotizaciones
FOR EACH ROW WHEN OLD.estado <> NEW.estado
BEGIN
  INSERT INTO cotizacion_historial (cotizacion_id, estado_anterior, estado_nuevo)
  VALUES (NEW.id, OLD.estado, NEW.estado);
END;

-- Regla de margen: no se puede ENVIAR con descuentos sobre el límite configurado
CREATE TRIGGER IF NOT EXISTS trg_cot_limite_descuento
BEFORE UPDATE OF estado ON cotizaciones
FOR EACH ROW WHEN NEW.estado = 'Enviada' AND OLD.estado <> 'Enviada'
BEGIN
  SELECT RAISE(ABORT, 'Hay ítems con descuento por encima del límite permitido')
  WHERE EXISTS (
    SELECT 1 FROM cotizacion_items i
    WHERE i.cotizacion_id = NEW.id
      AND i.descuento_pct > (SELECT CAST(valor AS REAL) FROM configuracion WHERE clave = 'limite_descuento_pct')
  );
END;

-- ============================================================
--  VISTAS (equivalentes a calcular(), calcularSolicitud() y agruparClientes() del front)
-- ============================================================

-- Totales por cotización (COP)
CREATE VIEW IF NOT EXISTS v_cotizacion_totales AS
SELECT
  c.id AS cotizacion_id,
  COALESCE(SUM(i.cantidad), 0)                                   AS num_unidades,
  COUNT(i.id)                                                    AS num_lineas,
  COALESCE(SUM(i.cantidad * i.precio_unitario), 0)               AS subtotal,
  COALESCE(SUM(i.cantidad * i.precio_unitario * i.descuento_pct / 100.0), 0) AS descuentos_lineas,
  c.descuento_adicional,
  COALESCE(SUM(i.cantidad * i.precio_unitario * (1 - i.descuento_pct / 100.0)), 0) - c.descuento_adicional AS base_imponible,
  (COALESCE(SUM(i.cantidad * i.precio_unitario * (1 - i.descuento_pct / 100.0)), 0) - c.descuento_adicional) * c.iva_pct / 100.0 AS iva,
  (COALESCE(SUM(i.cantidad * i.precio_unitario * (1 - i.descuento_pct / 100.0)), 0) - c.descuento_adicional) * (1 + c.iva_pct / 100.0) AS total
FROM cotizaciones c
LEFT JOIN cotizacion_items i ON i.cotizacion_id = c.id
GROUP BY c.id;

-- Lo que ve el comprador: Por Cotizar / Borrador / Enviada => "Pendiente"
CREATE VIEW IF NOT EXISTS v_cotizaciones_comprador AS
SELECT
  c.id, c.folio, c.empresa_id, c.solicitante_id, c.fecha_solicitud AS fecha,
  CASE WHEN c.estado IN ('Por Cotizar','Borrador','Enviada') THEN 'Pendiente' ELSE c.estado END AS estado,
  (c.estado = 'Enviada') AS puede_decidir,   -- el comprador solo aprueba/rechaza si ya fue enviada
  t.num_unidades, t.num_lineas, t.subtotal, t.base_imponible, t.total
FROM cotizaciones c
JOIN v_cotizacion_totales t ON t.cotizacion_id = c.id;

-- Resumen por cliente (pantalla Clientes del asesor)
CREATE VIEW IF NOT EXISTS v_clientes_resumen AS
SELECT
  e.id AS empresa_id, e.nombre, e.nit, e.sector, e.ciudad,
  COUNT(c.id)                                              AS solicitudes,
  SUM(c.estado = 'Aprobada')                               AS aprobadas,
  COALESCE(SUM(CASE WHEN c.estado <> 'Rechazada' THEN t.total END), 0) AS valor,
  MAX(c.fecha_solicitud)                                   AS ultima
FROM empresas e
JOIN cotizaciones c ON c.empresa_id = e.id
JOIN v_cotizacion_totales t ON t.cotizacion_id = c.id
GROUP BY e.id
ORDER BY valor DESC;
