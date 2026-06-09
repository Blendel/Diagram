import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'
export type EventLevel = 'info' | 'success' | 'warning' | 'error'

export interface AppEvent {
  id: string
  level: EventLevel
  message: string
  at: number
}

export type ContextTarget = 'node' | 'edge' | 'pane'

export interface ContextMenuState {
  /** Screen coordinates where the menu opens. */
  x: number
  y: number
  type: ContextTarget
  /** Id of the node/edge under the cursor (undefined for pane). */
  targetId?: string
}

const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `ev-${Math.random().toString(36).slice(2)}-${Date.now()}`

interface UiState {
  theme: Theme
  toggleTheme: () => void

  events: AppEvent[]
  pushEvent: (level: EventLevel, message: string) => void
  clearEvents: () => void

  /** Node whose detail modal is open, if any. */
  detailNodeId: string | null
  openDetail: (id: string) => void
  closeDetail: () => void

  contextMenu: ContextMenuState | null
  openContextMenu: (menu: ContextMenuState) => void
  closeContextMenu: () => void

  /** Collapsible side panels (responsive layout). */
  showPalette: boolean
  showInspector: boolean
  togglePalette: () => void
  toggleInspector: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),

      events: [],
      pushEvent: (level, message) =>
        set({
          events: [
            { id: uid(), level, message, at: Date.now() },
            ...get().events,
          ].slice(0, 50),
        }),
      clearEvents: () => set({ events: [] }),

      detailNodeId: null,
      openDetail: (id) => set({ detailNodeId: id, contextMenu: null }),
      closeDetail: () => set({ detailNodeId: null }),

      contextMenu: null,
      openContextMenu: (menu) => set({ contextMenu: menu }),
      closeContextMenu: () => set({ contextMenu: null }),

      showPalette: true,
      showInspector: true,
      togglePalette: () => set({ showPalette: !get().showPalette }),
      toggleInspector: () => set({ showInspector: !get().showInspector }),
    }),
    {
      name: 'architect:ui',
      // Persist durable UI prefs; events/menus are transient.
      partialize: (state) => ({
        theme: state.theme,
        showPalette: state.showPalette,
        showInspector: state.showInspector,
      }),
    },
  ),
)
