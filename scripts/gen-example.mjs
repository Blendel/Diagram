// Generates a feature-complete demo diagram importable via the "Importa" button.
// Run: node scripts/gen-example.mjs  → writes examples/demo-shopsphere.json
import { writeFileSync, mkdirSync } from 'node:fs'

const MARKER = { type: 'arrowclosed', color: '#64748b', width: 18, height: 18 }

let n = 0
const uid = (p) => `${p}-${++n}`

// --- builders ---------------------------------------------------------------
const group = (id, label, groupType, x, y, w, h) => ({
  id,
  type: 'group',
  position: { x, y },
  style: { width: w, height: h },
  data: { kind: 'group', label, status: 'unknown', groupType },
})

const comp = (id, kind, label, x, y, data = {}, extra = {}) => ({
  id,
  type: 'component',
  position: { x, y },
  data: { kind, label, status: 'healthy', ...data },
  ...extra,
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
const idx = (id, name, columns, unique = false) => ({ id, name, columns, unique })
const table = (id, name, x, y, columns, indexes = []) => ({ id, name, x, y, columns, indexes })
const rel = (id, source, target, sourceColumn, targetColumn, cardinality, extra = {}) => ({
  id, source, target, sourceColumn, targetColumn, cardinality, ...extra,
})
const field = (id, name, type, extra = {}) => ({ id, name, type, ...extra })
const coll = (id, name, x, y, fields) => ({ id, name, x, y, fields })
const dref = (id, source, target, sourceField, name) => ({ id, source, target, sourceField, name })
const ui = (id, kind, label, x, y, w, h, extra = {}) => ({
  id, type: 'ui', position: { x, y }, style: { width: w, height: h }, data: { kind, label, ...extra },
})
const uiEdge = (id, source, target) => ({
  id, source, target, type: 'smoothstep',
  markerEnd: { type: 'arrowclosed', color: '#3b82f6' },
  style: { stroke: '#3b82f6', strokeDasharray: '5 4' },
})

// --- Service drill-down: Orders (Clean/Hexagonal + HTTP methods) ------------
const ordersChildren = {
  nodes: [
    sub('o-ctrl', 'controller', 'OrdersController', 40, 40),
    sub('o-ep1', 'endpoint', 'POST /orders', 40, 170, { method: 'POST', signature: 'create(dto): Order' }),
    sub('o-ep2', 'endpoint', 'GET /orders/:id', 40, 300, { method: 'GET', signature: 'get(id): Order' }),
    sub('o-uc', 'usecase', 'PlaceOrder', 320, 60, { visibility: 'public', async: true }),
    sub('o-fn', 'function', 'reserveStock', 320, 200, { visibility: 'private', async: true, signature: '(items): Reservation' }),
    sub('o-port', 'port', 'PaymentPort', 320, 320),
    sub('o-repo', 'repository', 'OrderRepository', 600, 60),
    sub('o-adapter', 'adapter', 'StripeAdapter', 600, 200),
    sub('o-dto', 'dto', 'OrderDTO', 600, 320),
    sub('o-cls', 'class', 'Order', 840, 120, { signature: 'id, items[], total, status' }),
    sub('o-var', 'variable', 'MAX_ITEMS', 840, 250, { signature: '= 50' }),
    sub('o-note', 'note', 'Idempotency-Key richiesta', 320, 440),
  ],
  edges: [
    subEdge('oe1', 'o-ctrl', 'o-ep1'),
    subEdge('oe2', 'o-ctrl', 'o-ep2'),
    subEdge('oe3', 'o-ep1', 'o-uc'),
    subEdge('oe4', 'o-uc', 'o-fn'),
    subEdge('oe5', 'o-uc', 'o-port'),
    subEdge('oe6', 'o-port', 'o-adapter'),
    subEdge('oe7', 'o-uc', 'o-repo'),
    subEdge('oe8', 'o-repo', 'o-cls'),
    subEdge('oe9', 'o-fn', 'o-var'),
  ],
}

const analyticsChildren = {
  nodes: [
    sub('a-mod', 'module', 'StreamIngest', 40, 60),
    sub('a-fn', 'function', 'aggregateHourly', 320, 60, { async: true, signature: '(events): Metrics' }),
    sub('a-ep', 'endpoint', 'GET /report', 320, 200, { method: 'GET', signature: 'report(range): Report' }),
  ],
  edges: [subEdge('ae1', 'a-mod', 'a-fn'), subEdge('ae2', 'a-fn', 'a-ep')],
}

// Orders DB "Funzioni & oggetti" tab
const ordersDbObjects = {
  nodes: [
    sub('db-proc', 'procedure', 'recalc_order_total', 40, 40, { signature: '(order_id) RETURNS numeric' }),
    sub('db-view', 'view', 'v_active_orders', 320, 40, { signature: 'SELECT … WHERE status=open' }),
    sub('db-trg', 'trigger', 'trg_audit_orders', 40, 190, { signature: 'AFTER UPDATE ON orders' }),
  ],
  edges: [subEdge('dbe1', 'db-trg', 'db-proc')],
}

// --- Relational ERD: Orders DB (PK/FK/unique/default/indexes/crow's-foot) ---
const ordersDbTables = [
  table('t-customers', 'customers', 40, 40, [
    col('cc-id', 'id', 'uuid', { pk: true }),
    col('cc-email', 'email', 'text', { unique: true }),
    col('cc-name', 'name', 'text', { nullable: true }),
    col('cc-created', 'created_at', 'timestamptz', { default: 'now()' }),
  ], [idx('ix-cust-email', 'ix_customers_email', ['cc-email'], true)]),
  table('t-orders', 'orders', 380, 30, [
    col('co-id', 'id', 'uuid', { pk: true }),
    col('co-cust', 'customer_id', 'uuid', { fk: true }),
    col('co-total', 'total', 'numeric'),
    col('co-status', 'status', 'text', { default: "'open'" }),
    col('co-created', 'created_at', 'timestamptz', { default: 'now()' }),
  ], [idx('ix-ord-cust', 'ix_orders_customer', ['co-cust']), idx('ix-ord-status', 'ix_orders_status', ['co-status'])]),
  table('t-items', 'order_items', 720, 30, [
    col('ci-id', 'id', 'uuid', { pk: true }),
    col('ci-order', 'order_id', 'uuid', { fk: true }),
    col('ci-prod', 'product_id', 'uuid', { fk: true }),
    col('ci-qty', 'qty', 'int', { default: '1' }),
  ]),
  table('t-products', 'products', 720, 250, [
    col('cp-id', 'id', 'uuid', { pk: true }),
    col('cp-sku', 'sku', 'text', { unique: true }),
    col('cp-price', 'price', 'numeric'),
  ]),
  table('t-payments', 'payments', 380, 270, [
    col('cpa-id', 'id', 'uuid', { pk: true }),
    col('cpa-order', 'order_id', 'uuid', { fk: true }),
    col('cpa-amount', 'amount', 'numeric'),
    col('cpa-state', 'state', 'text' ),
  ]),
]
const ordersDbRels = [
  rel('odr1', 't-orders', 't-customers', 'co-cust', 'cc-id', '1-n', { name: 'fk_orders_customer', onDelete: 'restrict', onUpdate: 'cascade' }),
  rel('odr2', 't-items', 't-orders', 'ci-order', 'co-id', '1-n', { name: 'fk_items_order', onDelete: 'cascade' }),
  rel('odr3', 't-items', 't-products', 'ci-prod', 'cp-id', '1-n', { name: 'fk_items_product' }),
  rel('odr4', 't-payments', 't-orders', 'cpa-order', 'co-id', '1-1', { name: 'fk_payment_order', onDelete: 'cascade' }),
]

// --- Document DB (NoSQL): Catalog ------------------------------------------
const catalogCollections = [
  coll('c-products', 'products', 60, 60, [
    field('f-p-id', '_id', 'ObjectId'),
    field('f-p-sku', 'sku', 'string'),
    field('f-p-name', 'name', 'string'),
    field('f-p-price', 'price', 'decimal'),
    field('f-p-tags', 'tags', 'string', { array: true }),
    field('f-p-attrs', 'attributes', 'object', { embedded: true }),
    field('f-p-cat', 'category_id', 'ObjectId'),
  ]),
  coll('c-categories', 'categories', 460, 60, [
    field('f-c-id', '_id', 'ObjectId'),
    field('f-c-name', 'name', 'string'),
    field('f-c-parent', 'parent_id', 'ObjectId'),
  ]),
  coll('c-reviews', 'reviews', 460, 280, [
    field('f-r-id', '_id', 'ObjectId'),
    field('f-r-prod', 'product_id', 'ObjectId'),
    field('f-r-rating', 'rating', 'int'),
    field('f-r-author', 'author', 'object', { embedded: true }),
  ]),
]
const catalogRefs = [
  dref('cr1', 'c-products', 'c-categories', 'f-p-cat', 'category'),
  dref('cr2', 'c-reviews', 'c-products', 'f-r-prod', 'product'),
]

// --- Web App wireframe (rich, interactive, responsive) ----------------------
const webWireframe = {
  nodes: [
    // Screen 1: Home (desktop)
    ui('w-frame', 'frame', 'Home', 20, 20, 640, 780, { breakpoint: 'desktop' }),
    ui('w-nav', 'navbar', 'ShopSphere', 44, 44, 560, 46, { count: 4 }),
    ui('w-avatar', 'avatar', 'GG', 576, 44, 46, 46),
    ui('w-side', 'sidebar', 'Categorie', 44, 104, 150, 640, { count: 6 }),
    ui('w-tabs', 'tabs', 'Novità', 214, 104, 390, 40, { count: 3 }),
    ui('w-head', 'heading', 'Offerte di oggi', 214, 156, 300, 40, { size: 'lg' }),
    ui('w-input', 'input', 'Cerca prodotti…', 214, 206, 280, 40, { inputType: 'search' }),
    ui('w-btn', 'button', 'Cerca', 504, 206, 100, 40, { variant: 'solid', color: '#0891b2' }),
    ui('w-toggle', 'toggle', 'Solo disponibili', 214, 256, 200, 28, { on: true }),
    ui('w-slider', 'slider', 'Prezzo', 430, 256, 174, 28, { percent: 40 }),
    ui('w-chart', 'chart', 'Trend', 214, 296, 180, 150),
    ui('w-img', 'image', 'Hero', 410, 296, 194, 150),
    ui('w-table', 'table', 'Prodotti', 214, 460, 390, 150, { count: 4, cols: 4 }),
    ui('w-progress', 'progress', 'Stock', 214, 624, 280, 18, { percent: 70 }),
    ui('w-badge', 'badge', 'NEW', 520, 622, 70, 24, { variant: 'soft' }),
    ui('w-open', 'button', 'Apri scheda prodotto ›', 214, 660, 390, 44, { variant: 'solid', link: 'w-frame2' }),
    ui('w-pag', 'pagination', '', 214, 716, 220, 36, { count: 5 }),
    ui('w-foot', 'footer', '© ShopSphere', 44, 760, 580, 0, {}),

    // Screen 2: Product detail (desktop)
    ui('w-frame2', 'frame', 'Dettaglio prodotto', 700, 20, 560, 780, { breakpoint: 'desktop' }),
    ui('w2-bc', 'breadcrumb', 'Home', 724, 44, 320, 28, { count: 3 }),
    ui('w2-back', 'button', '‹ Indietro', 724, 78, 130, 38, { variant: 'outline', link: 'w-frame' }),
    ui('w2-img', 'image', 'Foto prodotto', 724, 124, 320, 220),
    ui('w2-head', 'heading', 'Cuffie Pro X', 724, 356, 260, 40, { size: 'lg' }),
    ui('w2-badge', 'badge', '-20%', 980, 360, 80, 26, { variant: 'solid', color: '#dc2626' }),
    ui('w2-desc', 'text', 'Descrizione', 724, 404, 420, 80, { lines: 3 }),
    ui('w2-radio', 'radio', 'Colore', 724, 496, 200, 96, { count: 3, tab: 0 }),
    ui('w2-chk', 'checkbox', 'Aggiungi garanzia', 724, 600, 280, 28, { checked: false }),
    ui('w2-select', 'select', 'Quantità', 724, 636, 200, 40),
    ui('w2-buy', 'button', 'Compra ora', 724, 686, 320, 48, { variant: 'solid' }),

    // Screen 3: Mobile variant of Home
    ui('w-m-frame', 'frame', 'Home', 1320, 20, 375, 720, { breakpoint: 'mobile' }),
    ui('w-m-nav', 'navbar', 'ShopSphere', 1340, 44, 335, 44, { count: 2 }),
    ui('w-m-input', 'input', 'Cerca…', 1340, 100, 335, 40, { inputType: 'search' }),
    ui('w-m-list', 'list', 'Prodotti', 1340, 152, 335, 360, { count: 5, withAvatar: true }),
    ui('w-m-buy', 'button', 'Vai al carrello', 1340, 524, 335, 46, { variant: 'solid' }),
  ],
  edges: [uiEdge('wfe1', 'w-open', 'w-frame2'), uiEdge('wfe2', 'w2-back', 'w-nav')],
}

// --- Nodes ------------------------------------------------------------------
const groups = [
  group('g-edge', 'Edge', 'region', 40, 60, 300, 520),
  group('g-core', 'Core Cluster', 'cluster', 640, 40, 470, 640),
  group('g-data', 'Data layer', 'vpc', 1150, 40, 420, 480),
  group('g-evt', 'Eventi & Analytics', 'namespace', 640, 720, 930, 320),
  group('g-ext', 'Terze parti', 'generic', 1620, 60, 240, 300),
]

// Nodes nested inside g-core (positions are relative to the group)
const nested = [
  comp('orders', 'service', 'Orders', 30, 70, {
    technology: 'Node.js', port: '8080', owner: 'Team Checkout', load: 70, children: ordersChildren,
  }, { parentId: 'g-core', extent: 'parent' }),
  comp('payments', 'service', 'Payments', 30, 300, {
    technology: 'Go', port: '8081', owner: 'Team Payments', status: 'degraded', load: 88, shape: 'pill',
  }, { parentId: 'g-core', extent: 'parent' }),
  comp('inventory', 'service', 'Inventory', 260, 70, {
    technology: 'Rust', port: '8082', status: 'down', load: 97,
  }, { parentId: 'g-core', extent: 'parent' }),
  comp('search', 'service', 'Search', 260, 300, {
    technology: 'Python', load: 55, shape: 'hexagon', color: '#db2777',
  }, { parentId: 'g-core', extent: 'parent' }),
]

const comps = [
  // Edge zone
  comp('web', 'client', 'Web App', 60, 120, { technology: 'React', load: 22, wireframe: webWireframe }),
  comp('mobile', 'client', 'Mobile App', 60, 300, { technology: 'Flutter', load: 14 }),
  comp('cdn', 'cdn', 'CDN', 60, 440, { technology: 'Cloudflare', load: 30 }),
  comp('dns', 'dns', 'DNS', 220, 440, { technology: 'Route 53' }),
  comp('waf', 'firewall', 'WAF', 380, 120, { technology: 'Cloud Armor' }),
  comp('lb', 'loadbalancer', 'Load Balancer', 380, 280, { load: 40 }),
  comp('gateway', 'gateway', 'API Gateway', 380, 440, { technology: 'NGINX', port: '443', load: 46 }),
  comp('auth', 'auth', 'Identity', 380, 600, { technology: 'Keycloak' }),
  // Data layer
  comp('ordersdb', 'database', 'Orders DB', 1190, 90, {
    technology: 'PostgreSQL 16', load: 52, dbMode: 'relational',
    tables: ordersDbTables, relations: ordersDbRels, children: ordersDbObjects,
  }),
  comp('catalogdb', 'database', 'Catalog DB', 1190, 270, {
    technology: 'MongoDB', load: 38, dbMode: 'document',
    collections: catalogCollections, references: catalogRefs,
  }),
  comp('redis', 'cache', 'Redis', 1410, 90, { technology: 'Redis 7', load: 31 }),
  comp('storage', 'storage', 'Object Storage', 1410, 270, { technology: 'S3', load: 20 }),
  comp('secrets', 'secrets', 'Vault', 1410, 420, { technology: 'HashiCorp Vault' }),
  // Eventing & analytics
  comp('kafka', 'queue', 'Events', 700, 800, { technology: 'Kafka', load: 60 }),
  comp('stream', 'stream', 'Stream Proc', 900, 760, { technology: 'Flink', load: 64 }),
  comp('analytics', 'service', 'Analytics', 900, 900, { technology: 'Spark', load: 66, color: '#0891b2', children: analyticsChildren }),
  comp('notifications', 'service', 'Notifications', 1140, 800, { technology: 'Python', load: 24, shape: 'pill' }),
  comp('warehouse', 'database', 'Warehouse', 1140, 940, { technology: 'ClickHouse', load: 44 }),
  comp('imgfn', 'serverless', 'Image Resizer', 1360, 800, { technology: 'Lambda', load: 18 }),
  comp('cron', 'scheduler', 'Nightly Batch', 1360, 930, { technology: 'Cron' }),
  comp('monitoring', 'monitoring', 'Observability', 700, 960, { technology: 'Grafana' }),
  comp('ml', 'custom', 'ML Inference', 1360, 660, { technology: 'PyTorch', load: 50, icon: 'Cpu', color: '#4f46e5' }),
  // Third party
  comp('stripe', 'external', 'Stripe', 1660, 120, { technology: 'Payments API', description: 'PSP esterno' }),
  comp('auth0', 'external', 'Auth0', 1660, 260, { technology: 'IdP' }),
]

// --- Edges ------------------------------------------------------------------
const edges = [
  edge('e-cdn-web', 'cdn', 'web', { protocol: 'other', sync: 'sync', label: 'assets' }, 'r', 'b'),
  edge('e-web-waf', 'web', 'waf', { protocol: 'http', sync: 'sync', label: 'HTTPS' }, 'r', 'l'),
  edge('e-mob-waf', 'mobile', 'waf', { protocol: 'http', sync: 'sync' }, 'r', 'l'),
  edge('e-web-dns', 'web', 'dns', { protocol: 'other', sync: 'sync' }, 'b', 't'),
  edge('e-waf-lb', 'waf', 'lb', { protocol: 'http', sync: 'sync' }, 'b', 't'),
  edge('e-lb-gw', 'lb', 'gateway', { protocol: 'http', sync: 'sync' }, 'b', 't'),
  edge('e-gw-auth', 'gateway', 'auth', { protocol: 'grpc', sync: 'sync', label: 'verify', bidirectional: true, sourceMult: '1', targetMult: '1' }, 'b', 't'),
  edge('e-gw-orders', 'gateway', 'orders', { protocol: 'http', sync: 'sync', sourceMult: '1', targetMult: '*' }, 'r', 'l'),
  edge('e-gw-search', 'gateway', 'search', { protocol: 'http', sync: 'sync' }, 'r', 'l'),
  edge('e-orders-pay', 'orders', 'payments', { protocol: 'grpc', sync: 'sync', label: 'charge' }, 'b', 't'),
  edge('e-orders-db', 'orders', 'ordersdb', { protocol: 'db', sync: 'sync', animation: 'pulse' }, 'r', 'l'),
  edge('e-orders-redis', 'orders', 'redis', { protocol: 'tcp', sync: 'sync', animation: 'flow', label: 'cache' }, 'r', 'l'),
  edge('e-orders-kafka', 'orders', 'kafka', { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'OrderCreated' }, 'b', 't'),
  edge('e-search-catalog', 'search', 'catalogdb', { protocol: 'db', sync: 'sync' }, 'r', 'l'),
  edge('e-search-redis', 'search', 'redis', { protocol: 'tcp', sync: 'sync', animation: 'flow' }, 'r', 'l'),
  edge('e-pay-db', 'payments', 'ordersdb', { protocol: 'db', sync: 'sync' }, 'r', 'l'),
  edge('e-pay-stripe', 'payments', 'stripe', { protocol: 'http', sync: 'sync', label: 'charge' }, 'r', 'l'),
  edge('e-pay-kafka', 'payments', 'kafka', { protocol: 'event', sync: 'async', label: 'PaymentDone' }, 'b', 'l'),
  edge('e-inv-db', 'inventory', 'ordersdb', { protocol: 'db', sync: 'sync' }, 'r', 'l'),
  edge('e-inv-kafka', 'inventory', 'kafka', { protocol: 'event', sync: 'async' }, 'b', 'l'),
  edge('e-auth-auth0', 'auth', 'auth0', { protocol: 'http', sync: 'sync', label: 'OIDC' }, 'r', 'l'),
  edge('e-orders-secrets', 'orders', 'secrets', { protocol: 'tcp', sync: 'sync', label: 'secrets' }, 'r', 'l'),
  edge('e-img-storage', 'imgfn', 'storage', { protocol: 'tcp', sync: 'sync' }, 'l', 'r'),
  edge('e-kafka-stream', 'kafka', 'stream', { protocol: 'event', sync: 'async', animation: 'flow' }, 'r', 'l'),
  edge('e-kafka-an', 'kafka', 'analytics', { protocol: 'event', sync: 'async', animation: 'flow', label: 'subscribe' }, 'r', 'l'),
  edge('e-kafka-not', 'kafka', 'notifications', { protocol: 'event', sync: 'async', animation: 'pubsub' }, 'r', 'l'),
  edge('e-stream-wh', 'stream', 'warehouse', { protocol: 'db', sync: 'sync', animation: 'pulse' }, 'r', 'l'),
  edge('e-an-wh', 'analytics', 'warehouse', { protocol: 'db', sync: 'sync' }, 'r', 'l'),
  edge('e-not-img', 'notifications', 'imgfn', { protocol: 'http', sync: 'sync' }, 'r', 'l'),
  edge('e-cron-storage', 'cron', 'storage', { protocol: 'tcp', sync: 'sync', label: 'backup' }, 't', 'b'),
  edge('e-mon-orders', 'monitoring', 'orders', { protocol: 'other', sync: 'async', label: 'scrape', bidirectional: false }, 't', 'b'),
  edge('e-ml-redis', 'ml', 'redis', { protocol: 'tcp', sync: 'sync' }, 'l', 'r'),
]

const file = {
  schema: 'architect-diagram',
  version: 3,
  diagram: {
    id: 'demo-shopsphere',
    name: 'ShopSphere — demo completa',
    nodes: [...groups, ...nested, ...comps],
    edges,
    updatedAt: Date.now(),
  },
}

mkdirSync(new URL('../examples/', import.meta.url), { recursive: true })
const out = new URL('../examples/demo-shopsphere.json', import.meta.url)
writeFileSync(out, JSON.stringify(file, null, 2))

const all = [...nested, ...comps]
console.log('Scritto:', out.pathname)
console.log('Gruppi:', groups.length, '· Componenti:', all.length, '· Connessioni:', edges.length)
console.log('Tipi nodo:', [...new Set(all.map((c) => c.data.kind))].sort().join(', '))
console.log('Annidati in gruppi:', nested.map((c) => c.data.label).join(', '))
console.log('Servizi con sotto-grafo:', all.filter((c) => c.data.children).map((c) => c.data.label).join(', '))
console.log('DB relazionali:', all.filter((c) => c.data.dbMode === 'relational').map((c) => c.data.label).join(', '))
console.log('DB documentali:', all.filter((c) => c.data.dbMode === 'document').map((c) => c.data.label).join(', '))
console.log('Wireframe:', all.filter((c) => c.data.wireframe).map((c) => c.data.label).join(', '))
console.log('Edge animati:', edges.filter((e) => e.data.animation && e.data.animation !== 'none').length)
console.log('Edge bidirezionali:', edges.filter((e) => e.data.bidirectional).length)
