import type { AppEdge, AppNode, DiagramNodeData, NodeKind } from '../types/diagram'
import { uid } from './uid'
import { DEFAULT_MARKER } from './edgeCatalog'

function node(
  kind: NodeKind,
  label: string,
  x: number,
  y: number,
  extra: Partial<DiagramNodeData> = {},
): AppNode {
  return {
    id: uid(),
    type: kind === 'group' ? 'group' : 'component',
    position: { x, y },
    data: { kind, label, status: 'healthy', ...extra },
  }
}

function edge(
  source: AppNode,
  target: AppNode,
  data: AppEdge['data'],
): AppEdge {
  return {
    id: uid(),
    type: 'flow',
    source: source.id,
    target: target.id,
    markerEnd: DEFAULT_MARKER,
    data,
  }
}

export interface Template {
  id: string
  name: string
  description: string
  build: () => { nodes: AppNode[]; edges: AppEdge[] }
}

export const TEMPLATES: Template[] = [
  {
    id: 'three-tier',
    name: 'Architettura 3-tier',
    description: 'Client → Gateway → Servizio → Database',
    build: () => {
      const client = node('client', 'Web App', 40, 180, { technology: 'React' })
      const gw = node('gateway', 'API Gateway', 300, 180, { technology: 'NGINX', port: '443' })
      const svc = node('service', 'App Service', 560, 180, { technology: 'Node.js', port: '8080', load: 40 })
      const db = node('database', 'Database', 840, 180, { technology: 'PostgreSQL', load: 35 })
      const cache = node('cache', 'Cache', 840, 360, { technology: 'Redis' })
      return {
        nodes: [client, gw, svc, db, cache],
        edges: [
          edge(client, gw, { protocol: 'http', sync: 'sync', label: 'HTTPS' }),
          edge(gw, svc, { protocol: 'http', sync: 'sync' }),
          edge(svc, db, { protocol: 'db', sync: 'sync' }),
          edge(svc, cache, { protocol: 'tcp', sync: 'sync', animation: 'flow' }),
        ],
      }
    },
  },
  {
    id: 'event-driven',
    name: 'Event-driven',
    description: 'Producer → Broker → Consumer (+ proiezione)',
    build: () => {
      const producer = node('service', 'Producer', 60, 120, { technology: 'Go', load: 45 })
      const broker = node('queue', 'Event Bus', 340, 200, { technology: 'Kafka', load: 50 })
      const c1 = node('service', 'Consumer A', 620, 80, { technology: 'Node.js' })
      const c2 = node('service', 'Consumer B', 620, 300, { technology: 'Python' })
      const db = node('database', 'Read Model', 880, 300, { technology: 'MongoDB' })
      return {
        nodes: [producer, broker, c1, c2, db],
        edges: [
          edge(producer, broker, { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'events' }),
          edge(broker, c1, { protocol: 'event', sync: 'async', animation: 'flow', label: 'subscribe' }),
          edge(broker, c2, { protocol: 'event', sync: 'async', animation: 'flow', label: 'subscribe' }),
          edge(c2, db, { protocol: 'db', sync: 'sync' }),
        ],
      }
    },
  },
  {
    id: 'microservices',
    name: 'Microservizi',
    description: 'Gateway, più servizi, dati condivisi ed eventi',
    build: () => {
      const client = node('client', 'Web App', 40, 240, { technology: 'React' })
      const lb = node('loadbalancer', 'Load Balancer', 280, 240)
      const gw = node('gateway', 'API Gateway', 520, 240, { port: '443' })
      const orders = node('service', 'Orders', 780, 100, { technology: 'Node.js', load: 50 })
      const users = node('service', 'Users', 780, 260, { technology: 'Java', load: 35 })
      const billing = node('service', 'Billing', 780, 420, { technology: 'Go', load: 40 })
      const ordersDb = node('database', 'Orders DB', 1040, 100, { technology: 'PostgreSQL' })
      const usersDb = node('database', 'Users DB', 1040, 260, { technology: 'PostgreSQL' })
      const queue = node('queue', 'Events', 1040, 420, { technology: 'RabbitMQ' })
      return {
        nodes: [client, lb, gw, orders, users, billing, ordersDb, usersDb, queue],
        edges: [
          edge(client, lb, { protocol: 'http', sync: 'sync', label: 'HTTPS' }),
          edge(lb, gw, { protocol: 'http', sync: 'sync' }),
          edge(gw, orders, { protocol: 'http', sync: 'sync' }),
          edge(gw, users, { protocol: 'http', sync: 'sync' }),
          edge(gw, billing, { protocol: 'http', sync: 'sync' }),
          edge(orders, ordersDb, { protocol: 'db', sync: 'sync' }),
          edge(users, usersDb, { protocol: 'db', sync: 'sync' }),
          edge(orders, queue, { protocol: 'event', sync: 'async', animation: 'pubsub', label: 'OrderCreated' }),
          edge(billing, queue, { protocol: 'event', sync: 'async', label: 'Invoiced' }),
        ],
      }
    },
  },
]
