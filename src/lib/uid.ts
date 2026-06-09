/** Generates a unique id, using crypto.randomUUID when available. */
export const uid = (prefix = 'id'): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now()}`
