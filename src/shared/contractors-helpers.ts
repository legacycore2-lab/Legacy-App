/**
 * Shared contractor normalisation helpers.
 * Used by both features/contractors and features/projects.
 * Keep this file pure — no Supabase, no feature-specific types.
 */

/**
 * Normalises a raw contractor_name string:
 * - trim leading/trailing whitespace
 * - collapse repeated internal spaces to one
 */
export function normaliseName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

/**
 * Builds the deduplication key:
 * - Latin chars lowercased (English case-insensitive merge)
 * - Arabic/non-Latin preserved (different Arabic names never merged)
 */
export function buildContractorKey(normalisedName: string): string {
  return normalisedName.replace(/[A-Za-z]/g, (c) => c.toLowerCase())
}

/**
 * Normalises raw DB entry_type to 'income' | 'expense' | null.
 * Unknown / null → null (caller decides — never silently treated as expense).
 */
export function normalizeEntryType(raw: string | null | undefined): 'income' | 'expense' | null {
  if (!raw) return null
  switch (raw.trim().toLowerCase()) {
    case 'income':
    case 'i':
      return 'income'
    case 'expense':
    case 'e':
      return 'expense'
    default:
      return null
  }
}

/**
 * Converts a raw DB amount to a non-negative finite number.
 * Non-parseable or negative → 0.
 */
export function parseAmount(raw: number | string | null | undefined): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}
