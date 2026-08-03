import { getSupabaseClient } from '../lib/supabase/client'

export const ENTRIES_PAGE_SIZE = 1000

/**
 * Generic range-based pagination helper for Supabase queries on the entries table.
 * Fetches all rows using sequential range() calls with a stable ORDER BY.
 *
 * Rules:
 * - page size = 1000 (Supabase default cap)
 * - stable ordering is REQUIRED before range() to avoid duplicate/missing rows
 * - continues until page.length < pageSize
 * - throws on any page error — never returns partial data silently
 *
 * @param buildQuery Function that receives (client, from, to) and returns an
 *   awaitable with { data, error }. The query MUST include .order() for stable results.
 */
export async function fetchAllWithPagination<T>(
  buildQuery: (
    client: ReturnType<typeof getSupabaseClient>,
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = []
  let from = 0

  while (true) {
    const to = from + ENTRIES_PAGE_SIZE - 1
    const { data, error } = await buildQuery(getSupabaseClient(), from, to)

    if (error) throw error

    const page = (data ?? []) as T[]
    rows.push(...page)
    if (page.length < ENTRIES_PAGE_SIZE) break
    from += ENTRIES_PAGE_SIZE
  }

  return rows
}
