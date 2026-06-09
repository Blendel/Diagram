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

// ===========================================================================
// 5. ML / AI Pipeline — ingestion, feature store, training, model serving
// ===========================================================================
function mlPipeline() {
  const servingChildren = {
    nodes: [
      sub('m-ep', 'endpoint', 'POST /predict', 40, 60, { method: 'POST', signature: '(features): Prediction' }),
      sub('m-fn', 'function', 'loadModel', 320, 60, { async: true }),
      sub('m-mod', 'module', 'Preprocessor', 320, 200),
      sub('m-cls', 'class', 'Model', 600, 120, { signature: 'version, weights' }),
    ],
    edges: [subEdge('me1', 'm-ep', 'm-fn'), subEdge('me2', 'm-fn', 'm-mod'), subEdge('me3', 'm-fn', 'm-cls')],
  }
  const fsTables = [
    table('t-feat', 'features', 40, 40, [
      col('f-id', 'id', 'uuid', { pk: true }),
      col('f-entity', 'entity_id', 'uuid', { fk: true }),
      col('f-name', 'name', 'text'),
      col('f-val', 'value', 'float8'),
    ], [{ id: 'ix-f', name: 'ix_features_entity', columns: ['f-entity'] }]),
    table('t-ent', 'entities', 360, 40, [
      col('en-id', 'id', 'uuid', { pk: true }),
      col('en-type', 'type', 'text'),
    ]),
  ]
  const fsRel = [rel('r1', 't-feat', 't-ent', 'f-entity', 'en-id', '1-n', { name: 'fk_feat_entity' })]
  const groups = [
    group('g-ingest', 'Ingestione', 'cluster', 20, 60, 360, 360),
    group('g-train', 'Training', 'namespace', 420, 60, 320, 360),
    group('g-serve', 'Serving', 'cluster', 780, 40, 420, 460),
  ]
  const nodes = [
    ...groups,
    comp('sources', 'external', 'Data Sources', 40, 460, { description: 'API esterne / log' }),
    comp('ingest', 'service', 'Ingestion', 50, 120, { load: 50 }),
    comp('bus', 'queue', 'Kafka', 50, 300, { load: 55 }),
    comp('pipe', 'stream', 'Feature Pipeline', 220, 120, { technology: 'Spark', load: 65 }),
    comp('featuredb', 'database', 'Feature Store', 220, 300, { technology: 'PostgreSQL', load: 45, dbMode: 'relational', tables: fsTables, relations: fsRel }),
    comp('lake', 'storage', 'Data Lake', 450, 120, { technology: 'S3' }),
    comp('train', 'serverless', 'Training Job', 450, 300, { technology: 'SageMaker', load: 80 }),
    comp('registry', 'storage', 'Model Registry', 620, 120, { technology: 'MLflow' }),
    comp('serving', 'custom', 'Model Serving', 820, 110, { technology: 'TorchServe', load: 60, icon: 'Cpu', color: '#4f46e5', children: servingChildren }),
    comp('gw', 'gateway', 'API Gateway', 820, 320, { port: '443' }),
    comp('app', 'client', 'Consumer App', 1040, 320, { technology: 'React' }),
    comp('drift', 'monitoring', 'Drift Monitor', 1040, 110, { technology: 'Evidently' }),
  ]
  const edges = [
    edge('e1', 'sources', 'ingest', { protocol: 'http', sync: 'async', label: 'pull' }, 'r', 'l'),
    edge('e2', 'ingest', 'bus', { protocol: 'event', sync: 'async', animation: 'pubsub' }, 'b', 't'),
    edge('e3', 'bus', 'pipe', { protocol: 'event', sync: 'async', animation: 'flow' }, 'r', 'b'),
    edge('e4', 'pipe', 'featuredb', { protocol: 'db', sync: 'sync', animation: 'pulse' }, 'b', 't'),
    edge('e5', 'pipe', 'lake', { protocol: 'tcp', sync: 'sync' }),
    edge('e6', 'lake', 'train', { protocol: 'tcp', sync: 'sync', label: 'dataset' }, 'b', 't'),
    edge('e7', 'featuredb', 'train', { protocol: 'db', sync: 'sync', label: 'features' }, 'r', 'l'),
    edge('e8', 'train', 'registry', { protocol: 'tcp', sync: 'sync', label: 'push model' }),
    edge('e9', 'registry', 'serving', { protocol: 'tcp', sync: 'sync', label: 'load' }),
    edge('e10', 'gw', 'serving', { protocol: 'grpc', sync: 'sync' }, 't', 'b'),
    edge('e11', 'app', 'gw', { protocol: 'http', sync: 'sync' }, 'l', 'r'),
    edge('e12', 'serving', 'drift', { protocol: 'event', sync: 'async', label: 'predictions' }, 'r', 'l'),
  ]
  return file('ml-pipeline', 'ML / AI Pipeline', nodes, edges)
}

// ===========================================================================
// 6. E-Health — security-first, FHIR store + clinical docs, audit
// ===========================================================================
function ehealth() {
  const tables = [
    table('t-pat', 'patients', 40, 40, [
      col('p-id', 'id', 'uuid', { pk: true }),
      col('p-mrn', 'mrn', 'text', { unique: true }),
      col('p-name', 'name', 'text'),
      col('p-dob', 'dob', 'date'),
    ], [{ id: 'ix-mrn', name: 'ix_patients_mrn', columns: ['p-mrn'], unique: true }]),
    table('t-enc', 'encounters', 360, 40, [
      col('e-id', 'id', 'uuid', { pk: true }),
      col('e-pat', 'patient_id', 'uuid', { fk: true }),
      col('e-date', 'date', 'timestamptz' ),
      col('e-type', 'type', 'text'),
    ]),
    table('t-obs', 'observations', 360, 260, [
      col('o-id', 'id', 'uuid', { pk: true }),
      col('o-enc', 'encounter_id', 'uuid', { fk: true }),
      col('o-code', 'loinc', 'text'),
      col('o-val', 'value', 'text'),
    ]),
  ]
  const relations = [
    rel('r1', 't-enc', 't-pat', 'e-pat', 'p-id', '1-n', { name: 'fk_enc_patient', onDelete: 'restrict' }),
    rel('r2', 't-obs', 't-enc', 'o-enc', 'e-id', '1-n', { name: 'fk_obs_encounter', onDelete: 'cascade' }),
  ]
  const docs = [
    coll('c-docs', 'clinical_docs', 60, 60, [
      field('cd-id', '_id', 'ObjectId'),
      field('cd-pat', 'patient_id', 'ObjectId'),
      field('cd-type', 'type', 'string'),
      field('cd-content', 'content', 'object', { embedded: true }),
      field('cd-att', 'attachments', 'string', { array: true }),
    ]),
  ]
  const groups = [
    group('g-edge', 'Accesso', 'region', 20, 60, 280, 360),
    group('g-core', 'Servizi clinici', 'cluster', 340, 40, 440, 520),
    group('g-data', 'Dati (PHI)', 'vpc', 820, 60, 420, 460),
  ]
  const nodes = [
    ...groups,
    comp('patient', 'client', 'Patient App', 50, 120, { technology: 'Flutter', load: 20 }),
    comp('provider', 'client', 'Provider Portal', 50, 300, { technology: 'Angular', load: 30 }),
    comp('waf', 'firewall', 'WAF', 200, 120, { technology: 'WAF' }),
    comp('gw', 'gateway', 'API Gateway', 200, 300, { port: '443', load: 40 }),
    comp('auth', 'auth', 'IAM (SSO)', 360, 80, { technology: 'OAuth2/OIDC' }),
    comp('appts', 'service', 'Appointments', 360, 230, { load: 45 }),
    comp('ehr', 'service', 'EHR', 560, 230, { load: 55 }),
    comp('billing', 'service', 'Billing', 360, 400, { load: 35 }),
    comp('vault', 'secrets', 'PHI Vault', 560, 400, { technology: 'Vault' }),
    comp('fhir', 'database', 'FHIR Store', 840, 110, { technology: 'PostgreSQL', load: 50, dbMode: 'relational', tables, relations }),
    comp('docdb', 'database', 'Clinical Docs', 840, 300, { technology: 'MongoDB', load: 30, dbMode: 'document', collections: docs, references: [] }),
    comp('audit', 'monitoring', 'Audit & Monitoring', 1060, 110, { technology: 'SIEM' }),
    comp('lab', 'external', 'Lab System', 1060, 300, { description: 'HL7/FHIR' }),
    comp('pharmacy', 'external', 'Pharmacy', 1060, 420, { description: 'e-Prescription' }),
  ]
  const edges = [
    edge('e1', 'patient', 'waf', { protocol: 'http', sync: 'sync', label: 'HTTPS' }),
    edge('e2', 'provider', 'gw', { protocol: 'http', sync: 'sync' }),
    edge('e3', 'waf', 'gw', { protocol: 'http', sync: 'sync' }, 'b', 't'),
    edge('e4', 'gw', 'auth', { protocol: 'grpc', sync: 'sync', bidirectional: true, sourceMult: '1', targetMult: '1' }),
    edge('e5', 'gw', 'appts', { protocol: 'http', sync: 'sync' }),
    edge('e6', 'appts', 'ehr', { protocol: 'grpc', sync: 'sync' }),
    edge('e7', 'gw', 'billing', { protocol: 'http', sync: 'sync' }, 'b', 'l'),
    edge('e8', 'ehr', 'fhir', { protocol: 'db', sync: 'sync', animation: 'pulse' }),
    edge('e9', 'ehr', 'docdb', { protocol: 'db', sync: 'sync' }, 'b', 'l'),
    edge('e10', 'ehr', 'vault', { protocol: 'tcp', sync: 'sync', label: 'decrypt PHI' }, 'b', 't'),
    edge('e11', 'ehr', 'lab', { protocol: 'http', sync: 'async', label: 'HL7' }, 'r', 'l'),
    edge('e12', 'billing', 'pharmacy', { protocol: 'http', sync: 'sync' }, 'r', 'l'),
    edge('e13', 'audit', 'ehr', { protocol: 'other', sync: 'async', label: 'audit log' }, 'l', 'r'),
  ]
  return file('ehealth', 'E-Health Platform', nodes, edges)
}

// ===========================================================================
// 7. Gaming Backend — matchmaking, realtime, leaderboard, anti-cheat
// ===========================================================================
function gamingBackend() {
  const mmChildren = {
    nodes: [
      sub('mm-ep', 'endpoint', 'POST /queue', 40, 60, { method: 'POST' }),
      sub('mm-uc', 'usecase', 'FindMatch', 320, 60, { async: true }),
      sub('mm-fn', 'function', 'rankPlayers', 320, 200, { signature: '(pool): Match' }),
      sub('mm-var', 'variable', 'MMR_RANGE', 600, 120, { signature: '= 150' }),
    ],
    edges: [subEdge('mme1', 'mm-ep', 'mm-uc'), subEdge('mme2', 'mm-uc', 'mm-fn'), subEdge('mme3', 'mm-fn', 'mm-var')],
  }
  const groups = [
    group('g-edge', 'Edge', 'region', 20, 60, 300, 460),
    group('g-core', 'Backend', 'cluster', 360, 40, 480, 560),
    group('g-data', 'Dati', 'vpc', 880, 60, 420, 460),
  ]
  const nodes = [
    ...groups,
    comp('console', 'client', 'Console', 50, 120, { technology: 'Unreal', load: 30 }),
    comp('pc', 'client', 'PC Client', 50, 280, { technology: 'Unity', load: 35 }),
    comp('mobile', 'client', 'Mobile', 50, 440, { technology: 'Unity', load: 25 }),
    comp('cdn', 'cdn', 'Asset CDN', 220, 120, { load: 50 }),
    comp('lb', 'loadbalancer', 'Load Balancer', 220, 280),
    comp('rt', 'gateway', 'Realtime GW', 220, 440, { technology: 'WebSocket', load: 60 }),
    comp('mm', 'service', 'Matchmaking', 390, 80, { load: 65, children: mmChildren }),
    comp('gs', 'custom', 'Game Server', 390, 230, { technology: 'Dedicated', load: 82, status: 'degraded', icon: 'Server', color: '#16a34a' }),
    comp('inv', 'service', 'Inventory', 390, 380, { load: 40 }),
    comp('anticheat', 'stream', 'Anti-Cheat', 390, 520, { technology: 'Flink', load: 70 }),
    comp('leaderboard', 'cache', 'Leaderboard', 900, 110, { technology: 'Redis', load: 55 }),
    comp('playerdb', 'database', 'Player DB', 900, 290, { technology: 'PostgreSQL', load: 48 }),
    comp('bus', 'queue', 'Event Bus', 640, 620, { technology: 'Kafka', load: 60 }),
    comp('analytics', 'service', 'Analytics', 1120, 290, { technology: 'BigQuery' }),
  ]
  const edges = [
    edge('e1', 'console', 'cdn', { protocol: 'other', sync: 'sync', label: 'assets' }),
    edge('e2', 'pc', 'lb', { protocol: 'http', sync: 'sync' }),
    edge('e3', 'mobile', 'rt', { protocol: 'tcp', sync: 'async', label: 'ws' }),
    edge('e4', 'pc', 'rt', { protocol: 'tcp', sync: 'async', label: 'ws' }),
    edge('e5', 'lb', 'mm', { protocol: 'http', sync: 'sync' }),
    edge('e6', 'rt', 'gs', { protocol: 'tcp', sync: 'async', bidirectional: true, label: 'state' }, 'r', 'l'),
    edge('e7', 'mm', 'gs', { protocol: 'grpc', sync: 'sync', label: 'assign' }),
    edge('e8', 'gs', 'playerdb', { protocol: 'db', sync: 'sync' }),
    edge('e9', 'gs', 'leaderboard', { protocol: 'tcp', sync: 'sync', animation: 'flow', label: 'score' }),
    edge('e10', 'inv', 'playerdb', { protocol: 'db', sync: 'sync' }),
    edge('e11', 'gs', 'bus', { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'MatchEvent' }, 'b', 't'),
    edge('e12', 'bus', 'anticheat', { protocol: 'event', sync: 'async', animation: 'flow' }, 'l', 'b'),
    edge('e13', 'bus', 'analytics', { protocol: 'event', sync: 'async' }, 'r', 'b'),
  ]
  return file('gaming-backend', 'Gaming Backend', nodes, edges)
}

// ===========================================================================
// 8. Logistics — orders, WMS, route optimization, fleet tracking
// ===========================================================================
function logistics() {
  const trackingWireframe = {
    nodes: [
      ui('tf', 'frame', 'Tracking', 20, 20, 380, 560, { breakpoint: 'mobile' }),
      ui('tn', 'navbar', 'TrackIt', 44, 44, 320, 44, { count: 2 }),
      ui('th', 'heading', 'Ordine #1234', 44, 104, 260, 36, { size: 'md' }),
      ui('tmap', 'image', 'Mappa', 44, 152, 320, 180),
      ui('tprog', 'progress', 'Consegna', 44, 348, 320, 18, { percent: 65 }),
      ui('tlist', 'list', 'Tappe', 44, 384, 320, 130, { count: 4, withAvatar: false }),
      ui('tbtn', 'button', 'Contatta corriere', 44, 528, 320, 44, { variant: 'solid' }),
      ui('tnote', 'note', 'ETA aggiornata via webhook', 240, 104, 130, 44),
    ],
    edges: [],
  }
  const ordTables = [
    table('t-ord', 'orders', 40, 40, [
      col('od-id', 'id', 'uuid', { pk: true }),
      col('od-cust', 'customer_id', 'uuid', { fk: true }),
      col('od-status', 'status', 'text', { default: "'created'" }),
    ]),
    table('t-ship', 'shipments', 360, 40, [
      col('sh-id', 'id', 'uuid', { pk: true }),
      col('sh-ord', 'order_id', 'uuid', { fk: true }),
      col('sh-eta', 'eta', 'timestamptz' ),
    ]),
  ]
  const ordRel = [rel('r1', 't-ship', 't-ord', 'sh-ord', 'od-id', '1-1', { name: 'fk_ship_order', onDelete: 'cascade' })]
  const groups = [
    group('g-field', 'Campo', 'zone', 20, 60, 280, 360),
    group('g-core', 'Servizi', 'cluster', 340, 40, 460, 480),
    group('g-data', 'Dati', 'vpc', 840, 60, 400, 360),
  ]
  const nodes = [
    ...groups,
    comp('fleet', 'client', 'Fleet Devices', 50, 120, { technology: 'GPS/Android', load: 30 }),
    comp('customer', 'client', 'Customer App', 50, 300, { technology: 'React Native', load: 18, wireframe: trackingWireframe }),
    comp('gw', 'gateway', 'API Gateway', 360, 90, { port: '443', load: 40 }),
    comp('orders', 'service', 'Order Service', 360, 240, { load: 50 }),
    comp('wms', 'service', 'Warehouse (WMS)', 560, 90, { load: 45 }),
    comp('routing', 'stream', 'Route Optimizer', 560, 240, { technology: 'Flink', load: 68 }),
    comp('notify', 'service', 'Notifications', 560, 390, { technology: 'Python' }),
    comp('ordersdb', 'database', 'Orders DB', 860, 110, { technology: 'PostgreSQL', load: 50, dbMode: 'relational', tables: ordTables, relations: ordRel }),
    comp('invdb', 'database', 'Inventory DB', 860, 300, { technology: 'PostgreSQL', load: 40 }),
    comp('bus', 'queue', 'Event Bus', 1080, 110, { technology: 'Kafka', load: 55 }),
    comp('maps', 'external', 'Maps API', 1080, 300, { description: 'Google Maps' }),
  ]
  const edges = [
    edge('e1', 'fleet', 'gw', { protocol: 'http', sync: 'async', label: 'GPS', sourceMult: '*', targetMult: '1' }),
    edge('e2', 'customer', 'gw', { protocol: 'http', sync: 'sync' }),
    edge('e3', 'gw', 'orders', { protocol: 'http', sync: 'sync' }, 'b', 'l'),
    edge('e4', 'gw', 'wms', { protocol: 'http', sync: 'sync' }),
    edge('e5', 'orders', 'ordersdb', { protocol: 'db', sync: 'sync', animation: 'pulse' }),
    edge('e6', 'wms', 'invdb', { protocol: 'db', sync: 'sync' }, 'b', 'l'),
    edge('e7', 'orders', 'bus', { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'OrderPlaced' }),
    edge('e8', 'bus', 'routing', { protocol: 'event', sync: 'async', animation: 'flow' }, 'l', 'r'),
    edge('e9', 'routing', 'maps', { protocol: 'http', sync: 'sync', label: 'directions' }),
    edge('e10', 'routing', 'notify', { protocol: 'event', sync: 'async', label: 'ETA' }, 'b', 'r'),
    edge('e11', 'notify', 'customer', { protocol: 'http', sync: 'async', label: 'push' }, 'l', 'b'),
  ]
  return file('logistics', 'Logistics / Supply Chain', nodes, edges)
}

// ---------------------------------------------------------------------------
const examples = [
  saasStarter(),
  iotPlatform(),
  streamingMedia(),
  bankingCqrs(),
  mlPipeline(),
  ehealth(),
  gamingBackend(),
  logistics(),
]
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
