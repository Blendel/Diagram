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

## Eseguibile desktop portable (Tauri)

L'app è impacchettabile come **eseguibile desktop nativo** con
[Tauri](https://tauri.app) (richiede la toolchain **Rust**).

```bash
npm run tauri:dev        # avvia l'app desktop in sviluppo
npm run tauri:build      # eseguibile PORTABLE (niente installer)
npm run tauri:installer  # genera anche gli installer NSIS/MSI
```

- **Portable**: `npm run tauri:build` produce un singolo file
  `src-tauri/target/release/architect.exe` (pochi MB) che si avvia
  **senza installazione** — basta copiarlo ed eseguirlo.
- Usa il runtime **WebView2**, preinstallato su Windows 10/11. Su macchine più
  vecchie senza WebView2 va installato una volta (oppure usare un bundle a
  runtime fisso).

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

## Esempi

Importa uno dei diagrammi in [examples/](examples/) (Toolbar → Importa, oppure
trascina il `.json` nell'app):

- **demo-shopsphere.json** — demo completa che usa tutte le funzionalità
- **saas-starter.json** — SaaS moderno (ERD, drill-down servizio, wireframe)
- **iot-platform.json** — IoT/edge, MQTT, stream processing, telemetria NoSQL
- **streaming-media.json** — piattaforma streaming a microservizi
- **banking-cqrs.json** — core banking CQRS/event-sourcing con sicurezza
- **ml-pipeline.json** — pipeline ML/AI (ingestion, feature store, training, serving)
- **ehealth.json** — piattaforma e-health (FHIR + docs, sicurezza/PHI, audit)
- **gaming-backend.json** — backend di gioco (matchmaking, realtime, anti-cheat)
- **logistics.json** — logistica/supply-chain (WMS, route optimizer, tracking)

Rigenerabili con `node scripts/gen-example.mjs` e `node scripts/gen-examples.mjs`.

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
- [x] Eseguibile desktop portable (Tauri)
- [ ] Aggancio a dati reali per gli stati live (health check / telemetria)
- [ ] Backend + condivisione / collaborazione

## Licenza

[MIT](LICENSE)
