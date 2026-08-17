import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSupabaseClient } from '../../../lib/supabase/client'
import { countProjectDeleteDependencies } from './projects.repository'

vi.mock('../../../lib/supabase/client', () => ({
  getSupabaseClient: vi.fn(),
}))

describe('countProjectDeleteDependencies', () => {
  beforeEach(() => vi.clearAllMocks())

  it('counts dependencies without assuming every table has an id column', async () => {
    const counts: Record<string, number> = {
      entries: 1,
      journals: 2,
      journal_lines: 3,
      advance_projects: 4,
      advance_transactions: 5,
    }
    const select = vi.fn()
    const from = vi.fn((table: string) => ({
      select: (columns: string, options: unknown) => {
        select(table, columns, options)
        return {
          eq: vi.fn().mockResolvedValue({ count: counts[table], error: null }),
        }
      },
    }))
    vi.mocked(getSupabaseClient).mockReturnValue({ from } as never)

    await expect(countProjectDeleteDependencies('project-1')).resolves.toEqual({
      entries: 1,
      journals: 2,
      journalLines: 3,
      advanceProjects: 4,
      advanceTransactions: 5,
    })

    expect(select).toHaveBeenCalledTimes(5)
    expect(select).toHaveBeenCalledWith('advance_projects', '*', { count: 'exact', head: true })
    expect(select).not.toHaveBeenCalledWith(expect.anything(), 'id', expect.anything())
  })
})
