import type { NodeShape } from '../types/diagram'

export type ShapeVariant = 'card' | 'compact' | 'cylinder'

export interface ShapeInfo {
  /** 'card' = header+body; 'cylinder' = DB look with detail; 'compact' = icon+label silhouette. */
  variant: ShapeVariant
  clipPath?: string
  borderRadius?: string
}

export const SHAPE_ORDER: NodeShape[] = [
  'rounded',
  'rectangle',
  'pill',
  'cylinder',
  'circle',
  'hexagon',
  'diamond',
]

export const SHAPE_LABEL: Record<NodeShape, string> = {
  rounded: 'Arrotondato',
  rectangle: 'Rettangolo',
  pill: 'Pillola',
  cylinder: 'Cilindro',
  circle: 'Cerchio',
  hexagon: 'Esagono',
  diamond: 'Rombo',
}

export function getShape(shape: NodeShape = 'rounded'): ShapeInfo {
  switch (shape) {
    case 'rectangle':
      return { variant: 'card', borderRadius: '3px' }
    case 'pill':
      return { variant: 'card', borderRadius: '9999px' }
    case 'cylinder':
      return { variant: 'cylinder' }
    case 'circle':
      return { variant: 'compact', borderRadius: '9999px' }
    case 'hexagon':
      return {
        variant: 'compact',
        clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
      }
    case 'diamond':
      return {
        variant: 'compact',
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      }
    case 'rounded':
    default:
      return { variant: 'card', borderRadius: '12px' }
  }
}
