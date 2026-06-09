# Architect — Diagrammi di architettura interattivi

Editor visuale per disegnare architetture a microservizi: trascini i componenti
sul canvas, li colleghi, ne descrivi i metadati e lo stato. Tutto gira nel
browser, con salvataggio automatico locale.

## Stack

- **React + TypeScript + Vite** (SPA statica, `base: './'` → pronta per Tauri/desktop)
- **@xyflow/react** (React Flow v12) — canvas a nodi drag-and-drop
- **Zustand** + **IndexedDB** (`idb-keyval`) — stato e salvataggio automatico
- **Tailwind CSS v4** + **lucide-react** — UI e icone

## Comandi

```bash
npm install      # installa le dipendenze
npm run dev      # dev server (HMR)
npm run build    # typecheck + build di produzione in dist/
npm run preview  # anteprima della build
```

## Funzionalità

- **Nodi tipizzati**: servizio, database, coda/broker, API gateway, cache, client
- **Gruppi/boundary** ridimensionabili (cluster, VPC, dominio) renderizzati dietro i nodi
- **Connessioni** colorate per protocollo (HTTP, gRPC, evento, DB, TCP), con
  etichetta e animazione del flusso per le chiamate asincrone
- **Inspector** con metadati per nodo (tecnologia, porta, owner, link, descrizione)
  e per connessione (protocollo, sync/async)
- **Stati live** sul nodo (operativo / degradato / non disponibile / sconosciuto)
- **Import/Export JSON** + salvataggio automatico in IndexedDB

## Struttura

```
src/
  types/diagram.ts            # modello dati (nodi, edge, file)
  lib/                        # cataloghi (nodi, edge), seed, I/O
  store/useDiagramStore.ts    # stato Zustand + persistenza
  components/
    canvas/                   # FlowCanvas, nodi, edge, drag-and-drop
    panels/                   # Toolbar, NodePalette, Inspector
```

## Idee per i prossimi passi

- Annidamento reale dei nodi nei gruppi (parent/extent on drag)
- Multi-diagramma (lista di architetture salvate)
- Aggancio a dati reali per gli stati live (health check / telemetria)
- Export PNG/SVG; impacchettamento desktop con Tauri
