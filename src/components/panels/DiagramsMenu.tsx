import { useState } from 'react'
import { Layers, Check, Plus, Copy, Trash2, Pencil, ChevronDown } from 'lucide-react'
import { useDiagramStore } from '../../store/useDiagramStore'

export function DiagramsMenu() {
  const diagrams = useDiagramStore((s) => s.diagrams)
  const currentId = useDiagramStore((s) => s.diagramId)
  const currentName = useDiagramStore((s) => s.name)
  const switchDiagram = useDiagramStore((s) => s.switchDiagram)
  const duplicateDiagram = useDiagramStore((s) => s.duplicateDiagram)
  const deleteDiagram = useDiagramStore((s) => s.deleteDiagram)
  const renameDiagram = useDiagramStore((s) => s.renameDiagram)
  const newDiagram = useDiagramStore((s) => s.newDiagram)
  const [open, setOpen] = useState(false)

  const list = Object.values(diagrams).sort((a, b) => b.updatedAt - a.updatedAt)

  const nameOf = (id: string, fallback: string) => (id === currentId ? currentName : fallback)

  const onRename = (id: string, current: string) => {
    const next = window.prompt('Nuovo nome del diagramma', current)
    if (next && next.trim()) renameDiagram(id, next.trim())
  }
  const onDelete = (id: string, label: string) => {
    if (window.confirm(`Eliminare il diagramma "${label}"?`)) deleteDiagram(id)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
        title="Diagrammi salvati"
      >
        <Layers size={15} />
        <span className="hidden sm:inline">Diagrammi</span>
        <span className="text-[11px] text-slate-400">({list.length})</span>
        <ChevronDown size={13} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 left-0 w-72 max-h-80 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl pop-in py-1">
            {list.length === 0 && (
              <p className="px-3 py-3 text-sm text-slate-400">Nessun diagramma salvato</p>
            )}
            {list.map((d) => {
              const isCurrent = d.id === currentId
              const label = nameOf(d.id, d.name)
              return (
                <div
                  key={d.id}
                  className={`group flex items-center gap-1.5 px-2 py-1.5 ${
                    isCurrent ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <button
                    onClick={() => {
                      switchDiagram(d.id)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <Check
                      size={14}
                      className={isCurrent ? 'text-blue-600 shrink-0' : 'text-transparent shrink-0'}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-slate-700 dark:text-slate-200 truncate">
                        {label || 'Senza titolo'}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {(d.nodes?.length ?? 0)} nodi
                      </span>
                    </span>
                  </button>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                    <button
                      className="grid place-items-center w-6 h-6 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Rinomina"
                      onClick={() => onRename(d.id, label)}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="grid place-items-center w-6 h-6 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Duplica"
                      onClick={() => duplicateDiagram(d.id)}
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      className="grid place-items-center w-6 h-6 rounded text-red-400 hover:text-red-600"
                      title="Elimina"
                      onClick={() => onDelete(d.id, label)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}

            <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
              <button
                onClick={() => {
                  newDiagram()
                  setOpen(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <Plus size={15} /> Nuovo diagramma
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
