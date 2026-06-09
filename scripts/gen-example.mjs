// Generates a feature-complete demo diagram importable via the "Importa" button.
// Run: node scripts/gen-example.mjs  → writes examples/demo-shopsphere.json
import { writeFileSync, mkdirSync } from 'node:fs'

const MARKER = { type: 'arrowclosed', color: '#64748b', width: 18, height: 18 }

const group = (id, label, x, y, w, h) => ({
  id,
  type: 'group',
  position: { x, y },
  style: { width: w, height: h },
  data: { kind: 'group', label, status: 'unknown' },
})

const node = (id, kind, label, x, y, data = {}) => ({
  id,
  type: 'component',
  position: { x, y },
  data: { kind, label, status: 'healthy', ...data },
})

const edge = (id, source, target, data, sh = 'r', th = 'l') => ({
  id,
  type: 'flow',
  source,
  target,
  sourceHandle: sh,
  targetHandle: th,
  markerEnd: MARKER,
  data,
})

const sub = (id, kind, label, x, y, extra = {}) => ({
  id,
  type: 'sub',
  position: { x, y },
  data: { kind, label, signature: '', description: '', ...extra },
})
const subEdge = (id, source, target) => ({ id, source, target, type: 'smoothstep' })

const col = (id, name, type, extra = {}) => ({ id, name, type, ...extra })
const table = (id, name, x, y, columns) => ({ id, name, x, y, columns })
const rel = (id, source, target, sourceColumn, targetColumn, cardinality = '1-n') => ({
  id, source, target, sourceColumn, targetColumn, cardinality,
})

// --- Sub-graphs (component drill-down) --------------------------------------
const ordersChildren = {
  nodes: [
    sub('o-ep1', 'endpoint', 'POST /orders', 40, 40, { signature: 'createOrder(dto): Order' }),
    sub('o-ep2', 'endpoint', 'GET /orders/:id', 40, 180, { signature: 'getOrder(id): Order' }),
    sub('o-fn1', 'function', 'reserveStock', 320, 30, { signature: '(items): Reservation' }),
    sub('o-fn2', 'function', 'calcTotal', 320, 170, { signature: '(cart): Money' }),
    sub('o-cls', 'class', 'Order', 600, 40, { signature: 'id, items[], total, status' }),
    sub('o-mod', 'module', 'OrderRepository', 600, 180),
    sub('o-var', 'variable', 'MAX_ITEMS', 600, 300, { signature: '= 50' }),
    sub('o-note', 'note', 'Idempotency-Key obbligatoria', 320, 300),
  ],
  edges: [
    subEdge('oe1', 'o-ep1', 'o-fn1'),
    subEdge('oe2', 'o-ep1', 'o-fn2'),
    subEdge('oe3', 'o-fn2', 'o-cls'),
    subEdge('oe4', 'o-ep2', 'o-mod'),
    subEdge('oe5', 'o-fn1', 'o-var'),
  ],
}

const paymentsChildren = {
  nodes: [
    sub('p-ep', 'endpoint', 'POST /charge', 40, 60, { signature: 'charge(order): Receipt' }),
    sub('p-fn', 'function', 'callProvider', 320, 60, { signature: '(req): PspResponse' }),
    sub('p-cls', 'class', 'Transaction', 320, 200, { signature: 'id, amount, state' }),
    sub('p-var', 'variable', 'RETRY_MAX', 600, 130, { signature: '= 3' }),
  ],
  edges: [subEdge('pe1', 'p-ep', 'p-fn'), subEdge('pe2', 'p-fn', 'p-cls'), subEdge('pe3', 'p-fn', 'p-var')],
}

const analyticsChildren = {
  nodes: [
    sub('a-mod', 'module', 'StreamIngest', 40, 60),
    sub('a-fn', 'function', 'aggregateHourly', 320, 60, { signature: '(events): Metrics' }),
    sub('a-ep', 'endpoint', 'GET /report', 320, 200, { signature: 'report(range): Report' }),
  ],
  edges: [subEdge('ae1', 'a-mod', 'a-fn'), subEdge('ae2', 'a-fn', 'a-ep')],
}

// Database "Funzioni & oggetti" tab (procedures, views, triggers).
const ordersDbObjects = {
  nodes: [
    sub('db-proc', 'procedure', 'recalc_order_total', 40, 40, { signature: '(order_id) RETURNS numeric' }),
    sub('db-view', 'view', 'v_active_orders', 320, 40, { signature: 'SELECT … WHERE status=open' }),
    sub('db-trg', 'trigger', 'trg_audit_orders', 40, 190, { signature: 'AFTER UPDATE ON orders' }),
    sub('db-fn', 'function', 'fn_apply_tax', 320, 190, { signature: '(amount) RETURNS numeric' }),
  ],
  edges: [subEdge('dbe1', 'db-trg', 'db-proc')],
}

// Web App page wireframe (UI design).
const ui = (id, kind, label, x, y, w, h, extra = {}) => ({
  id, type: 'ui', position: { x, y }, style: { width: w, height: h }, data: { kind, label, ...extra },
})
const webWireframe = {
  nodes: [
    // Screen 1: Home
    ui('w-frame', 'frame', 'Home', 40, 20, 360, 640),
    ui('w-nav', 'navbar', 'ShopSphere', 64, 60, 280, 46, { count: 3 }),
    ui('w-avatar', 'avatar', 'GG', 352, 60, 48, 48),
    ui('w-tabs', 'tabs', 'Novità', 64, 116, 320, 38, { count: 3 }),
    ui('w-head', 'heading', 'Offerte di oggi', 64, 168, 240, 40, { size: 'lg' }),
    ui('w-img', 'image', 'Hero banner', 64, 216, 320, 150),
    ui('w-input', 'input', 'Cerca prodotti…', 64, 384, 320, 42, { inputType: 'search' }),
    ui('w-toggle', 'toggle', 'Solo disponibili', 64, 438, 200, 28, { on: true }),
    ui('w-list', 'list', 'Prodotti', 64, 476, 320, 110, { count: 4, withAvatar: true }),
    ui('w-open', 'button', 'Apri scheda prodotto ›', 64, 598, 320, 44, { variant: 'solid', link: 'w-frame2' }),
    // Screen 2: Product detail
    ui('w-frame2', 'frame', 'Dettaglio prodotto', 440, 20, 360, 640),
    ui('w2-back', 'button', '‹ Indietro', 464, 60, 130, 38, { variant: 'outline', link: 'w-frame' }),
    ui('w2-img', 'image', 'Foto prodotto', 464, 110, 320, 200),
    ui('w2-head', 'heading', 'Cuffie Pro X', 464, 326, 260, 40, { size: 'lg' }),
    ui('w2-badge', 'badge', '-20%', 700, 332, 80, 26, { variant: 'solid' }),
    ui('w2-desc', 'text', 'Descrizione', 464, 374, 320, 80, { lines: 3 }),
    ui('w2-chk', 'checkbox', 'Aggiungi garanzia', 464, 468, 280, 28, { checked: false }),
    ui('w2-buy', 'button', 'Compra ora', 464, 510, 320, 48, { variant: 'solid' }),
  ],
  edges: [],
}

// --- Database schemas (ERD) -------------------------------------------------
const ordersDbTables = [
  table('t-customers', 'customers', 40, 40, [
    col('cc-id', 'id', 'uuid', { pk: true }),
    col('cc-email', 'email', 'text'),
    col('cc-name', 'name', 'text'),
  ]),
  table('t-orders', 'orders', 360, 30, [
    col('co-id', 'id', 'uuid', { pk: true }),
    col('co-cust', 'customer_id', 'uuid', { fk: true }),
    col('co-total', 'total', 'numeric'),
    col('co-status', 'status', 'text'),
    col('co-created', 'created_at', 'timestamptz'),
  ]),
  table('t-items', 'order_items', 700, 30, [
    col('ci-id', 'id', 'uuid', { pk: true }),
    col('ci-order', 'order_id', 'uuid', { fk: true }),
    col('ci-prod', 'product_id', 'uuid', { fk: true }),
    col('ci-qty', 'qty', 'int'),
  ]),
  table('t-products', 'products', 700, 250, [
    col('cp-id', 'id', 'uuid', { pk: true }),
    col('cp-sku', 'sku', 'text'),
    col('cp-price', 'price', 'numeric'),
  ]),
  table('t-payments', 'payments', 360, 270, [
    col('cpa-id', 'id', 'uuid', { pk: true }),
    col('cpa-order', 'order_id', 'uuid', { fk: true }),
    col('cpa-amount', 'amount', 'numeric'),
    col('cpa-state', 'state', 'text'),
  ]),
]
const ordersDbRels = [
  rel('odr1', 't-orders', 't-customers', 'co-cust', 'cc-id', '1-n'),
  rel('odr2', 't-items', 't-orders', 'ci-order', 'co-id', '1-n'),
  rel('odr3', 't-items', 't-products', 'ci-prod', 'cp-id', '1-n'),
  rel('odr4', 't-payments', 't-orders', 'cpa-order', 'co-id', '1-1'),
]

const usersDbTables = [
  table('t-users', 'users', 40, 40, [
    col('u-id', 'id', 'uuid', { pk: true }),
    col('u-email', 'email', 'text'),
    col('u-hash', 'password_hash', 'text'),
  ]),
  table('t-roles', 'roles', 360, 40, [
    col('r-id', 'id', 'uuid', { pk: true }),
    col('r-name', 'name', 'text'),
  ]),
  table('t-sessions', 'sessions', 40, 230, [
    col('s-id', 'id', 'uuid', { pk: true }),
    col('s-user', 'user_id', 'uuid', { fk: true }),
    col('s-exp', 'expires_at', 'timestamptz'),
  ]),
]
const usersDbRels = [
  rel('udr1', 't-sessions', 't-users', 's-user', 'u-id', '1-n'),
  rel('udr2', 't-users', 't-roles', undefined, undefined, 'n-n'),
]

const warehouseTables = [
  table('w-fact', 'fact_sales', 60, 60, [
    col('wf-id', 'id', 'bigint', { pk: true }),
    col('wf-date', 'date_id', 'int', { fk: true }),
    col('wf-amount', 'amount', 'numeric'),
  ]),
  table('w-dim', 'dim_date', 380, 60, [
    col('wd-id', 'id', 'int', { pk: true }),
    col('wd-day', 'day', 'date'),
  ]),
]
const warehouseRels = [rel('wr1', 'w-fact', 'w-dim', 'wf-date', 'wd-id', '1-n')]

// --- Nodes ------------------------------------------------------------------
const groups = [
  group('g-client', 'Canale client', 0, 80, 280, 420),
  group('g-edge', 'Edge / Gateway', 320, 80, 300, 420),
  group('g-core', 'Servizi core', 660, 40, 520, 640),
  group('g-data', 'Data layer', 1220, 40, 380, 460),
  group('g-evt', 'Eventi & Analytics', 660, 720, 960, 340),
  group('g-ext', 'Terze parti (no accesso)', 1640, 80, 240, 360),
]

const comps = [
  // Client zone
  node('web', 'client', 'Web App', 50, 150, { technology: 'React', load: 22, wireframe: webWireframe }),
  node('mobile', 'client', 'Mobile App', 50, 330, { technology: 'Flutter', load: 14 }),
  // Edge zone
  node('cdn', 'cache', 'CDN', 380, 150, { technology: 'Cloudflare', load: 30 }),
  node('gateway', 'gateway', 'API Gateway', 410, 330, { technology: 'NGINX', port: '443', load: 46 }),
  // Core services
  node('orders', 'service', 'Orders', 700, 110, {
    technology: 'Node.js', port: '8080', owner: 'Team Checkout', load: 70, children: ordersChildren,
  }),
  node('payments', 'service', 'Payments', 700, 300, {
    technology: 'Go', port: '8081', owner: 'Team Payments', status: 'degraded', load: 82, children: paymentsChildren,
  }),
  node('inventory', 'service', 'Inventory', 700, 500, {
    technology: 'Rust', port: '8082', owner: 'Team Supply', status: 'down', load: 97,
  }),
  node('users', 'service', 'Users', 960, 110, { technology: 'Java', port: '8090', load: 38, shape: 'pill' }),
  node('auth', 'service', 'Auth', 960, 300, { technology: 'Go', port: '8091', load: 28, shape: 'rectangle' }),
  node('search', 'service', 'Search', 960, 500, {
    technology: 'Python', port: '8093', load: 60, shape: 'hexagon', color: '#db2777',
  }),
  // Data layer
  node('ordersdb', 'database', 'Orders DB', 1260, 120, {
    technology: 'PostgreSQL 16', load: 52, tables: ordersDbTables, relations: ordersDbRels, children: ordersDbObjects,
  }),
  node('usersdb', 'database', 'Users DB', 1260, 300, {
    technology: 'PostgreSQL 16', load: 34, tables: usersDbTables, relations: usersDbRels,
  }),
  node('redis', 'cache', 'Redis', 1450, 210, { technology: 'Redis 7', load: 31 }),
  // Eventing & analytics
  node('kafka', 'queue', 'Events', 700, 800, { technology: 'Kafka', load: 60 }),
  node('analytics', 'service', 'Analytics', 980, 760, {
    technology: 'Spark', load: 66, color: '#0891b2', children: analyticsChildren,
  }),
  node('notifications', 'service', 'Notifications', 980, 920, {
    technology: 'Python', load: 24, shape: 'pill',
  }),
  node('warehouse', 'database', 'Data Warehouse', 1260, 800, {
    technology: 'ClickHouse', load: 44, tables: warehouseTables, relations: warehouseRels,
  }),
  node('biclient', 'client', 'BI Dashboard', 1470, 880, { technology: 'Metabase', load: 12 }),
  // External / third-party systems (no access or internal knowledge)
  node('auth0', 'external', 'Auth0', 1680, 140, { technology: 'IdP', description: 'Identity provider SaaS' }),
  node('stripe', 'external', 'Stripe', 1680, 320, { technology: 'Payments API', description: 'PSP esterno' }),
]

// --- Edges (protocols, sync/async, animations) ------------------------------
const edges = [
  edge('e-cdn-web', 'cdn', 'web', { protocol: 'other', sync: 'sync', label: 'assets' }, 'l', 'r'),
  edge('e-web-gw', 'web', 'gateway', { protocol: 'http', sync: 'sync', label: 'HTTPS' }, 'r', 'l'),
  edge('e-mob-gw', 'mobile', 'gateway', { protocol: 'http', sync: 'sync' }, 'r', 'l'),
  edge('e-gw-orders', 'gateway', 'orders', { protocol: 'http', sync: 'sync' }, 'r', 'l'),
  edge('e-gw-users', 'gateway', 'users', { protocol: 'http', sync: 'sync' }, 'r', 'l'),
  edge('e-gw-search', 'gateway', 'search', { protocol: 'http', sync: 'sync' }, 'r', 'l'),
  edge('e-orders-pay', 'orders', 'payments', { protocol: 'grpc', sync: 'sync', label: 'verifica pagamento' }, 'b', 't'),
  edge('e-orders-db', 'orders', 'ordersdb', { protocol: 'db', sync: 'sync' }, 'r', 'l'),
  edge('e-orders-redis', 'orders', 'redis', { protocol: 'tcp', sync: 'sync', animation: 'flow', label: 'cache' }, 'r', 'l'),
  edge('e-orders-kafka', 'orders', 'kafka', { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'OrderCreated' }, 'b', 't'),
  edge('e-pay-db', 'payments', 'ordersdb', { protocol: 'db', sync: 'sync' }, 'r', 'l'),
  edge('e-pay-kafka', 'payments', 'kafka', { protocol: 'event', sync: 'async', label: 'PaymentDone' }, 'b', 'l'),
  edge('e-inv-db', 'inventory', 'ordersdb', { protocol: 'db', sync: 'sync' }, 'r', 'l'),
  edge('e-inv-kafka', 'inventory', 'kafka', { protocol: 'event', sync: 'async', label: 'StockChanged' }, 'b', 'l'),
  edge('e-users-db', 'users', 'usersdb', { protocol: 'db', sync: 'sync', animation: 'pulse' }, 'r', 'l'),
  edge('e-auth-db', 'auth', 'usersdb', { protocol: 'db', sync: 'sync' }, 'r', 'l'),
  edge('e-search-redis', 'search', 'redis', { protocol: 'tcp', sync: 'sync', animation: 'flow' }, 'r', 'l'),
  edge('e-kafka-an', 'kafka', 'analytics', { protocol: 'event', sync: 'async', animation: 'flow', label: 'subscribe' }, 'r', 'l'),
  edge('e-kafka-not', 'kafka', 'notifications', { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'subscribe' }, 'r', 'l'),
  edge('e-an-wh', 'analytics', 'warehouse', { protocol: 'db', sync: 'sync', animation: 'pulse' }, 'r', 'l'),
  edge('e-an-bi', 'analytics', 'biclient', { protocol: 'http', sync: 'sync', label: 'reports' }, 'r', 'l'),
  // External integrations
  edge('e-auth-auth0', 'auth', 'auth0', { protocol: 'http', sync: 'sync', label: 'OIDC' }, 'r', 'l'),
  edge('e-pay-stripe', 'payments', 'stripe', { protocol: 'http', sync: 'sync', label: 'charge' }, 'r', 'l'),
]

const file = {
  schema: 'architect-diagram',
  version: 3,
  diagram: {
    id: 'demo-shopsphere',
    name: 'ShopSphere — demo completa',
    nodes: [...groups, ...comps],
    edges,
    updatedAt: Date.now(),
  },
}

mkdirSync(new URL('../examples/', import.meta.url), { recursive: true })
const out = new URL('../examples/demo-shopsphere.json', import.meta.url)
writeFileSync(out, JSON.stringify(file, null, 2))

const kinds = new Set(comps.map((n) => n.data.kind))
const shapes = new Set(comps.map((n) => n.data.shape ?? '(default)'))
const animations = new Set(edges.map((e) => e.data.animation ?? 'none'))
const protocols = new Set(edges.map((e) => e.data.protocol))
console.log('Scritto:', out.pathname)
console.log('Gruppi:', groups.length, '· Componenti:', comps.length, '· Connessioni:', edges.length)
console.log('Tipi nodo:', [...kinds].join(', '))
console.log('Forme usate (override):', [...shapes].join(', '))
console.log('Animazioni:', [...animations].join(', '))
console.log('Protocolli:', [...protocols].join(', '))
console.log('Servizi con sotto-grafo:', comps.filter((n) => n.data.children).map((n) => n.data.label).join(', '))
console.log('Database con schema:', comps.filter((n) => n.data.tables).map((n) => n.data.label).join(', '))
