// Generates a set of focused example diagrams in examples/.
// Run: node scripts/gen-examples.mjs
import { writeFileSync, mkdirSync } from 'node:fs'

const MARKER = { type: 'arrowclosed', color: '#64748b', width: 18, height: 18 }
let n = 0
const uid = (p) => `${p}-${++n}`

const group = (id, label, groupType, x, y, w, h) => ({
  id, type: 'group', position: { x, y }, style: { width: w, height: h },
  data: { kind: 'group', label, status: 'unknown', groupType },
})
const comp = (id, kind, label, x, y, data = {}, extra = {}) => ({
  id, type: 'component', position: { x, y }, data: { kind, label, status: 'healthy', ...data }, ...extra,
})
const child = (id, kind, label, parentId, x, y, data = {}) =>
  comp(id, kind, label, x, y, data, { parentId, extent: 'parent' })
const edge = (id, source, target, data, sh = 'r', th = 'l') => ({
  id, type: 'flow', source, target, sourceHandle: sh, targetHandle: th, markerEnd: MARKER, data,
})
const sub = (id, kind, label, x, y, extra = {}) => ({
  id, type: 'sub', position: { x, y }, data: { kind, label, signature: '', description: '', ...extra },
})
const subEdge = (id, s, t) => ({ id, source: s, target: t, type: 'smoothstep' })
const col = (id, name, type, extra = {}) => ({ id, name, type, ...extra })
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

const file = (id, name, nodes, edges) => ({
  schema: 'architect-diagram', version: 3,
  diagram: { id, name, nodes, edges, updatedAt: Date.now() },
})

// ===========================================================================
// 1. SaaS Starter — clean modern SaaS (ERD + service drill-down + wireframe)
// ===========================================================================
function saasStarter() {
  const coreChildren = {
    nodes: [
      sub('s-ctrl', 'controller', 'WorkspaceController', 40, 40),
      sub('s-ep', 'endpoint', 'POST /workspaces', 40, 170, { method: 'POST', signature: 'create(dto): Workspace' }),
      sub('s-uc', 'usecase', 'CreateWorkspace', 320, 60, { async: true }),
      sub('s-repo', 'repository', 'WorkspaceRepo', 320, 200),
      sub('s-cls', 'class', 'Workspace', 600, 120, { signature: 'id, name, plan, ownerId' }),
    ],
    edges: [subEdge('se1', 's-ctrl', 's-ep'), subEdge('se2', 's-ep', 's-uc'), subEdge('se3', 's-uc', 's-repo'), subEdge('se4', 's-repo', 's-cls')],
  }
  const tables = [
    table('t-users', 'users', 40, 40, [
      col('u-id', 'id', 'uuid', { pk: true }),
      col('u-email', 'email', 'text', { unique: true }),
      col('u-name', 'name', 'text'),
    ], [{ id: 'ix-u', name: 'ix_users_email', columns: ['u-email'], unique: true }]),
    table('t-ws', 'workspaces', 360, 40, [
      col('w-id', 'id', 'uuid', { pk: true }),
      col('w-owner', 'owner_id', 'uuid', { fk: true }),
      col('w-plan', 'plan', 'text', { default: "'free'" }),
    ]),
    table('t-sub', 'subscriptions', 360, 250, [
      col('sb-id', 'id', 'uuid', { pk: true }),
      col('sb-ws', 'workspace_id', 'uuid', { fk: true }),
      col('sb-status', 'status', 'text'),
    ]),
  ]
  const relations = [
    rel('r1', 't-ws', 't-users', 'w-owner', 'u-id', '1-n', { name: 'fk_ws_owner', onDelete: 'cascade' }),
    rel('r2', 't-sub', 't-ws', 'sb-ws', 'w-id', '1-1', { name: 'fk_sub_ws', onDelete: 'cascade' }),
  ]
  const wireframe = {
    nodes: [
      ui('lf', 'frame', 'Login', 20, 20, 380, 520, { breakpoint: 'desktop' }),
      ui('ln', 'navbar', 'AcmeSaaS', 44, 44, 320, 44, { count: 2 }),
      ui('lh', 'heading', 'Bentornato', 44, 110, 240, 38, { size: 'lg' }),
      ui('le', 'input', 'Email', 44, 168, 320, 40, { inputType: 'email' }),
      ui('lp', 'input', 'Password', 44, 218, 320, 40, { inputType: 'password' }),
      ui('lc', 'checkbox', 'Ricordami', 44, 268, 200, 28, { checked: true }),
      ui('lb', 'button', 'Accedi', 44, 308, 320, 44, { variant: 'solid', link: 'df' }),
      ui('lnote', 'note', 'SSO + email/password', 44, 364, 200, 90),
      ui('df', 'frame', 'Dashboard', 430, 20, 460, 520, { breakpoint: 'desktop' }),
      ui('dn', 'navbar', 'AcmeSaaS', 454, 44, 412, 44, { count: 4 }),
      ui('ds', 'sidebar', 'Menu', 454, 100, 130, 420, { count: 5 }),
      ui('dh', 'heading', 'Panoramica', 600, 100, 260, 36, { size: 'md' }),
      ui('dc', 'chart', 'MRR', 600, 146, 260, 150),
      ui('dt', 'table', 'Workspace', 600, 310, 260, 150, { count: 3, cols: 3 }),
    ],
    edges: [],
  }
  const groups = [
    group('g-edge', 'Edge', 'region', 20, 40, 280, 420),
    group('g-svc', 'Servizi', 'cluster', 340, 40, 360, 420),
    group('g-data', 'Dati', 'vpc', 740, 40, 360, 420),
  ]
  const nodes = [
    ...groups,
    comp('web', 'client', 'Web App', 50, 110, { technology: 'Next.js', load: 25, wireframe }),
    comp('mobile', 'client', 'Mobile', 50, 300, { technology: 'React Native', load: 12 }),
    comp('cdn', 'cdn', 'CDN', 200, 110, { technology: 'Vercel' }),
    comp('gw', 'gateway', 'API Gateway', 360, 110, { port: '443', load: 40 }),
    comp('auth', 'auth', 'Auth', 360, 300, { technology: 'Clerk' }),
    comp('core', 'service', 'Core API', 540, 110, { technology: 'Node.js', port: '8080', load: 55, children: coreChildren }),
    comp('billing', 'service', 'Billing', 540, 300, { technology: 'Go', load: 30 }),
    comp('db', 'database', 'Postgres', 760, 110, { technology: 'PostgreSQL 16', load: 48, dbMode: 'relational', tables, relations }),
    comp('redis', 'cache', 'Redis', 980, 110, { technology: 'Redis' }),
    comp('storage', 'storage', 'Object Storage', 760, 300, { technology: 'S3' }),
    comp('stripe', 'external', 'Stripe', 980, 300, { technology: 'Payments' }),
    comp('mon', 'monitoring', 'Observability', 540, 470, { technology: 'Datadog' }),
  ]
  const edges = [
    edge('e1', 'web', 'cdn', { protocol: 'other', sync: 'sync', label: 'assets' }),
    edge('e2', 'web', 'gw', { protocol: 'http', sync: 'sync', label: 'HTTPS' }),
    edge('e3', 'mobile', 'gw', { protocol: 'http', sync: 'sync' }),
    edge('e4', 'gw', 'auth', { protocol: 'grpc', sync: 'sync', bidirectional: true, sourceMult: '1', targetMult: '1' }, 'b', 't'),
    edge('e5', 'gw', 'core', { protocol: 'http', sync: 'sync', sourceMult: '1', targetMult: '*' }),
    edge('e6', 'gw', 'billing', { protocol: 'http', sync: 'sync' }, 'b', 'l'),
    edge('e7', 'core', 'db', { protocol: 'db', sync: 'sync', animation: 'pulse' }),
    edge('e8', 'core', 'redis', { protocol: 'tcp', sync: 'sync', animation: 'flow' }),
    edge('e9', 'billing', 'db', { protocol: 'db', sync: 'sync' }),
    edge('e10', 'billing', 'stripe', { protocol: 'http', sync: 'sync', label: 'charge' }),
    edge('e11', 'core', 'storage', { protocol: 'tcp', sync: 'sync' }, 'b', 'l'),
    edge('e12', 'mon', 'core', { protocol: 'other', sync: 'async', label: 'scrape' }, 't', 'b'),
  ]
  return file('saas-starter', 'SaaS Starter', nodes, edges)
}

// ===========================================================================
// 2. IoT Platform — devices, MQTT, stream processing, time-series + telemetry
// ===========================================================================
function iotPlatform() {
  const telemetry = [
    coll('c-dev', 'devices', 60, 60, [
      field('d-id', '_id', 'ObjectId'),
      field('d-serial', 'serial', 'string'),
      field('d-meta', 'metadata', 'object', { embedded: true }),
      field('d-tags', 'tags', 'string', { array: true }),
    ]),
    coll('c-read', 'readings', 460, 60, [
      field('r-id', '_id', 'ObjectId'),
      field('r-dev', 'device_id', 'ObjectId'),
      field('r-ts', 'ts', 'date'),
      field('r-vals', 'values', 'object', { embedded: true }),
    ]),
  ]
  const refs = [dref('tr1', 'c-read', 'c-dev', 'r-dev', 'device')]
  const groups = [
    group('g-field', 'Campo / Edge', 'zone', 20, 60, 300, 360),
    group('g-ingest', 'Ingestione', 'cluster', 360, 60, 380, 360),
    group('g-data', 'Dati & Analisi', 'vpc', 780, 60, 420, 420),
  ]
  const nodes = [
    ...groups,
    comp('devices', 'client', 'Device Fleet', 50, 120, { technology: 'MCU/Sensors', load: 30 }),
    comp('edge', 'gateway', 'Edge Gateway', 50, 300, { technology: 'Greengrass' }),
    comp('mqtt', 'queue', 'MQTT Broker', 390, 110, { technology: 'EMQX', load: 65 }),
    comp('stream', 'stream', 'Rules / Stream', 560, 110, { technology: 'Flink', load: 70 }),
    comp('fn', 'serverless', 'Alert Fn', 390, 300, { technology: 'Lambda' }),
    comp('tsdb', 'database', 'TimescaleDB', 800, 110, { technology: 'TimescaleDB', load: 55 }),
    comp('teldb', 'database', 'Telemetry Store', 800, 300, { technology: 'MongoDB', load: 40, dbMode: 'document', collections: telemetry, references: refs }),
    comp('storage', 'storage', 'Cold Storage', 1020, 110, { technology: 'S3 Glacier' }),
    comp('dash', 'client', 'Dashboard', 1020, 300, { technology: 'Grafana', load: 15 }),
    comp('mon', 'monitoring', 'Monitoring', 560, 300, { technology: 'Prometheus' }),
  ]
  const edges = [
    edge('e1', 'devices', 'edge', { protocol: 'tcp', sync: 'async', label: 'sensors' }, 'b', 't'),
    edge('e2', 'edge', 'mqtt', { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'publish' }),
    edge('e3', 'mqtt', 'stream', { protocol: 'event', sync: 'async', animation: 'flow', label: 'subscribe' }),
    edge('e4', 'stream', 'tsdb', { protocol: 'db', sync: 'sync', animation: 'pulse' }),
    edge('e5', 'stream', 'teldb', { protocol: 'db', sync: 'sync' }, 'b', 'l'),
    edge('e6', 'stream', 'fn', { protocol: 'event', sync: 'async', label: 'threshold' }, 'b', 'r'),
    edge('e7', 'tsdb', 'storage', { protocol: 'tcp', sync: 'async', label: 'archive' }),
    edge('e8', 'dash', 'tsdb', { protocol: 'http', sync: 'sync', label: 'query' }, 't', 'b'),
    edge('e9', 'mon', 'stream', { protocol: 'other', sync: 'async', label: 'scrape' }, 't', 'b'),
  ]
  return file('iot-platform', 'IoT Platform', nodes, edges)
}

// ===========================================================================
// 3. Streaming Media — microservices, CDN, video storage, recommendations
// ===========================================================================
function streamingMedia() {
  const recoChildren = {
    nodes: [
      sub('rc-mod', 'module', 'FeatureStore', 40, 60),
      sub('rc-fn', 'function', 'rankTitles', 320, 60, { async: true, signature: '(userId): Title[]' }),
      sub('rc-ep', 'endpoint', 'GET /reco', 320, 200, { method: 'GET' }),
    ],
    edges: [subEdge('rce1', 'rc-mod', 'rc-fn'), subEdge('rce2', 'rc-fn', 'rc-ep')],
  }
  const groups = [
    group('g-edge', 'Edge', 'region', 20, 60, 300, 460),
    group('g-core', 'Microservizi', 'cluster', 360, 40, 460, 560),
    group('g-data', 'Dati', 'vpc', 860, 60, 420, 460),
  ]
  const nodes = [
    ...groups,
    comp('tv', 'client', 'Smart TV', 50, 120, { technology: 'tvOS', load: 20 }),
    comp('web', 'client', 'Web', 50, 280, { technology: 'React', load: 30 }),
    comp('mobile', 'client', 'Mobile', 50, 440, { technology: 'Flutter', load: 25 }),
    comp('cdn', 'cdn', 'CDN', 220, 120, { technology: 'Akamai', load: 60 }),
    comp('lb', 'loadbalancer', 'Load Balancer', 220, 280),
    comp('gw', 'gateway', 'API Gateway', 220, 440, { port: '443', load: 50 }),
    comp('catalog', 'service', 'Catalog', 390, 80, { load: 45 }),
    comp('playback', 'service', 'Playback', 390, 220, { load: 75, status: 'degraded' }),
    comp('reco', 'service', 'Recommendations', 390, 360, { load: 60, color: '#db2777', children: recoChildren }),
    comp('user', 'service', 'User', 390, 500, { load: 35 }),
    comp('catalogdb', 'database', 'Catalog DB', 880, 110, { technology: 'PostgreSQL' }),
    comp('userdb', 'database', 'User DB', 880, 290, { technology: 'PostgreSQL' }),
    comp('redis', 'cache', 'Redis', 1100, 110, { technology: 'Redis' }),
    comp('video', 'storage', 'Video Storage', 1100, 290, { technology: 'S3 + CloudFront' }),
    comp('kafka', 'queue', 'Events', 640, 620, { technology: 'Kafka', load: 55 }),
    comp('analytics', 'service', 'Analytics', 880, 470, { technology: 'Spark', load: 50 }),
  ]
  const edges = [
    edge('e1', 'tv', 'cdn', { protocol: 'other', sync: 'sync', label: 'stream' }),
    edge('e2', 'web', 'cdn', { protocol: 'other', sync: 'sync' }),
    edge('e3', 'mobile', 'gw', { protocol: 'http', sync: 'sync' }),
    edge('e4', 'web', 'lb', { protocol: 'http', sync: 'sync' }),
    edge('e5', 'lb', 'gw', { protocol: 'http', sync: 'sync' }),
    edge('e6', 'gw', 'catalog', { protocol: 'http', sync: 'sync' }),
    edge('e7', 'gw', 'playback', { protocol: 'http', sync: 'sync' }),
    edge('e8', 'gw', 'reco', { protocol: 'http', sync: 'sync' }),
    edge('e9', 'gw', 'user', { protocol: 'http', sync: 'sync' }),
    edge('e10', 'catalog', 'catalogdb', { protocol: 'db', sync: 'sync' }),
    edge('e11', 'user', 'userdb', { protocol: 'db', sync: 'sync' }),
    edge('e12', 'reco', 'redis', { protocol: 'tcp', sync: 'sync', animation: 'flow' }),
    edge('e13', 'playback', 'video', { protocol: 'tcp', sync: 'sync', label: 'segments' }),
    edge('e14', 'cdn', 'video', { protocol: 'other', sync: 'sync', label: 'origin' }, 'b', 't'),
    edge('e15', 'playback', 'kafka', { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'PlayEvent' }, 'b', 't'),
    edge('e16', 'kafka', 'analytics', { protocol: 'event', sync: 'async', animation: 'flow' }),
    edge('e17', 'kafka', 'reco', { protocol: 'event', sync: 'async', label: 'signals' }, 'l', 'b'),
  ]
  return file('streaming-media', 'Streaming Platform', nodes, edges)
}

// ===========================================================================
// 4. Core Banking (CQRS + security) — ERD, bidirectional, firewall/vault
// ===========================================================================
function bankingCqrs() {
  const tables = [
    table('t-acc', 'accounts', 40, 40, [
      col('a-id', 'id', 'uuid', { pk: true }),
      col('a-iban', 'iban', 'text', { unique: true }),
      col('a-owner', 'owner_id', 'uuid', { fk: true }),
      col('a-balance', 'balance', 'numeric', { default: '0' }),
    ], [{ id: 'ix-iban', name: 'ix_accounts_iban', columns: ['a-iban'], unique: true }]),
    table('t-tx', 'transactions', 380, 40, [
      col('t-id', 'id', 'uuid', { pk: true }),
      col('t-from', 'from_account', 'uuid', { fk: true }),
      col('t-to', 'to_account', 'uuid', { fk: true }),
      col('t-amount', 'amount', 'numeric'),
      col('t-ts', 'created_at', 'timestamptz', { default: 'now()' }),
    ], [{ id: 'ix-tx-from', name: 'ix_tx_from', columns: ['t-from'] }]),
    table('t-owners', 'owners', 40, 280, [
      col('o-id', 'id', 'uuid', { pk: true }),
      col('o-name', 'name', 'text' ),
    ]),
  ]
  const relations = [
    rel('r1', 't-acc', 't-owners', 'a-owner', 'o-id', '1-n', { name: 'fk_acc_owner' }),
    rel('r2', 't-tx', 't-acc', 't-from', 'a-id', '1-n', { name: 'fk_tx_from', onDelete: 'restrict' }),
    rel('r3', 't-tx', 't-acc', 't-to', 'a-id', '1-n', { name: 'fk_tx_to', onDelete: 'restrict' }),
  ]
  const groups = [
    group('g-edge', 'Perimetro', 'region', 20, 60, 280, 360),
    group('g-core', 'Core Cluster', 'cluster', 340, 40, 460, 520),
    group('g-data', 'Dati', 'vpc', 840, 60, 420, 360),
  ]
  const nodes = [
    ...groups,
    comp('web', 'client', 'Home Banking', 50, 120, { technology: 'Angular', load: 28 }),
    comp('waf', 'firewall', 'WAF', 50, 300, { technology: 'F5' }),
    comp('gw', 'gateway', 'API Gateway', 200, 120, { port: '443', load: 45 }),
    comp('auth', 'auth', 'IAM', 200, 300, { technology: 'Keycloak' }),
    comp('cmd', 'service', 'Command API', 370, 80, { load: 60 }),
    comp('query', 'service', 'Query API', 370, 230, { load: 40 }),
    comp('proj', 'service', 'Ledger Projector', 600, 230, { load: 50 }),
    comp('fraud', 'stream', 'Fraud Detection', 600, 380, { technology: 'Flink', load: 72 }),
    comp('vault', 'secrets', 'Vault', 370, 380, { technology: 'HashiCorp Vault' }),
    comp('es', 'database', 'Event Store', 860, 110, { technology: 'EventStoreDB', load: 55 }),
    comp('bus', 'queue', 'Event Bus', 860, 300, { technology: 'Kafka', load: 60 }),
    comp('readdb', 'database', 'Accounts (read)', 1080, 110, { technology: 'PostgreSQL', load: 48, dbMode: 'relational', tables, relations }),
    comp('notify', 'service', 'Notifications', 1080, 300, { technology: 'Python' }),
    comp('mon', 'monitoring', 'Monitoring', 600, 90, { technology: 'Grafana' }),
  ]
  const edges = [
    edge('e1', 'web', 'waf', { protocol: 'http', sync: 'sync', label: 'HTTPS' }, 'b', 't'),
    edge('e2', 'waf', 'gw', { protocol: 'http', sync: 'sync' }, 'r', 'b'),
    edge('e3', 'gw', 'auth', { protocol: 'grpc', sync: 'sync', bidirectional: true, sourceMult: '1', targetMult: '1' }, 'b', 't'),
    edge('e4', 'gw', 'cmd', { protocol: 'http', sync: 'sync', label: 'command' }),
    edge('e5', 'gw', 'query', { protocol: 'http', sync: 'sync', label: 'query' }, 'r', 'l'),
    edge('e6', 'cmd', 'es', { protocol: 'db', sync: 'sync', label: 'append', animation: 'pulse' }),
    edge('e7', 'cmd', 'bus', { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'events' }, 'b', 'l'),
    edge('e8', 'cmd', 'vault', { protocol: 'tcp', sync: 'sync', label: 'secrets' }, 'b', 't'),
    edge('e9', 'bus', 'proj', { protocol: 'event', sync: 'async', animation: 'flow' }, 'l', 'b'),
    edge('e10', 'proj', 'readdb', { protocol: 'db', sync: 'sync', animation: 'pulse' }),
    edge('e11', 'query', 'readdb', { protocol: 'db', sync: 'sync' }),
    edge('e12', 'bus', 'fraud', { protocol: 'event', sync: 'async', animation: 'flow', label: 'tx stream' }, 'l', 'r'),
    edge('e13', 'bus', 'notify', { protocol: 'event', sync: 'async' }),
    edge('e14', 'mon', 'cmd', { protocol: 'other', sync: 'async', label: 'scrape' }, 'l', 't'),
  ]
  return file('banking-cqrs', 'Core Banking (CQRS)', nodes, edges)
}

// ---------------------------------------------------------------------------
const examples = [saasStarter(), iotPlatform(), streamingMedia(), bankingCqrs()]
mkdirSync(new URL('../examples/', import.meta.url), { recursive: true })
for (const ex of examples) {
  const url = new URL(`../examples/${ex.diagram.id}.json`, import.meta.url)
  writeFileSync(url, JSON.stringify(ex, null, 2))
  const comps = ex.diagram.nodes.filter((x) => x.type === 'component')
  console.log(
    `Scritto ${ex.diagram.id}.json — ${ex.diagram.nodes.length} nodi, ${ex.diagram.edges.length} edge ·`,
    [...new Set(comps.map((c) => c.data.kind))].length,
    'tipi',
  )
}
