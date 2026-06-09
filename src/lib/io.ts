import type { DiagramFile } from '../types/diagram'
import { SCHEMA_VERSION } from '../types/diagram'
import { migrateDiagram } from './migrate'

/** Triggers a download of the diagram as a pretty-printed `.json` file. */
export function downloadDiagram(file: DiagramFile): void {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeName = (file.diagram.name || 'diagramma').replace(/[^\w.-]+/g, '_')
  a.download = `${safeName}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Reads and validates an imported diagram file. Throws on invalid input. */
export async function readDiagramFile(file: File): Promise<DiagramFile> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('JSON non valido')
  }
  const obj = parsed as Partial<DiagramFile>
  if (obj?.schema !== 'architect-diagram' || !obj.diagram) {
    throw new Error('Formato non riconosciuto')
  }
  // Upgrade older files to the current schema before they enter the app.
  return {
    schema: 'architect-diagram',
    version: SCHEMA_VERSION,
    diagram: migrateDiagram(obj.diagram),
  }
}
