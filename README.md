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

- **Nodi tipizzati**: servizio, database, coda/broker, API gateway, cache, client,
  **sistema esterno** e gruppi/boundary; forme geometriche, colori (palette + libero)
- **Stato da carico**: uno slider pilota lo stato (operativo → degradato → non disponibile)
- **Connessioni** per protocollo (HTTP, gRPC, evento, DB, TCP) con animazioni
  flow / pulse / pub-sub e **propagazione a cascata dei link interrotti**
- **Drill-down** (doppio click): sotto-grafo dei servizi, **schema ERD + oggetti** dei
  database, **designer di pagine wireframe** con modalità anteprima interattiva
- **Dark mode**, **undo/redo**, context menu, status bar con log eventi
- **Import/Export JSON** + **export PNG/SVG** + salvataggio automatico in IndexedDB

## Esempio

Importa [examples/demo-shopsphere.json](examples/demo-shopsphere.json) (Toolbar → Importa)
per una demo completa, oppure rigenerala con `node scripts/gen-example.mjs`.

## Struttura

```
src/
  types/diagram.ts            # modello dati (nodi, edge, sotto-grafi, file)
  lib/                        # cataloghi, seed, I/O, impatto, forme, colori
  store/                      # stato Zustand + persistenza (diagramma e UI)
  components/
    canvas/                   # FlowCanvas, nodi, edge, context menu
    panels/                   # Toolbar, NodePalette, Inspector, StatusBar
    detail/                   # vista dettaglio: ERD, sotto-grafo, wireframe
```

## Roadmap

- [x] Export PNG/SVG
- [x] Multi-diagramma (lista di architetture salvate)
- [x] Selezione multipla + operazioni di gruppo (allinea/distribuisci/colore/stato)
- [x] Annidamento reale dei nodi nei gruppi (parent/extent on drag)
- [x] Auto-layout (dagre)
- [ ] Aggancio a dati reali per gli stati live (health check / telemetria)
- [ ] Backend + condivisione / collaborazione

## Licenza

[MIT](LICENSE)
