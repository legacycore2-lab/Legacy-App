export const ENTRIES_PAGE_SIZE = 1000

/**
 * Pure pagination loop — no Supabase dependency.
 *
 * Callers (Repositories) supply `fetchPage(from, to)` which internally uses
 * getSupabaseClient(). This keeps all Supabase access inside Repository/
 * Infrastructure and makes shared/ genuinely portable.
 *
 * Rules:
 * - pageSize = 1000 (Supabase default cap)
 * - stable ORDER BY is the caller's responsibility before passing the fetcher
 * - continues until page.length < pageSize
 * - throws on any page error — never returns partial data silently
 */
export async function fetchAllWithPagination<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = []
  let from = 0

  while (true) {
    const to = from + ENTRIES_PAGE_SIZE - 1
    const { data, error } = await fetchPage(from, to)

    if (error) throw error

    const page = (data ?? []) as T[]
    rows.push(...page)
    if (page.length < ENTRIES_PAGE_SIZE) break
    from += ENTRIES_PAGE_SIZE
  }

  return rows
}
