import { describe, expect, it, vi } from 'vitest'
import { ENTRIES_PAGE_SIZE } from './pagination-helpers'

// ─── Test the pagination loop logic directly ──────────────────────────────────
// We test fetchAllWithPagination by constructing a mock buildQuery that tracks
// calls. The client arg is passed through as-is (we don't assert on it since
// it's undefined in the mocked environment — we assert on from/to).

vi.mock('../lib/supabase/client', () => ({
  getSupabaseClient: vi.fn(() => undefined),
}))

import { fetchAllWithPagination } from './pagination-helpers'

type Row = { id: string; entry_number: number }

function makeRows(count: number, startAt = 1): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${startAt + i}`,
    entry_number: startAt + i,
  }))
}

describe('fetchAllWithPagination', () => {
  it('returns all rows from a single page smaller than pageSize', async () => {
    const rows = makeRows(5)
    const calls: [number, number][] = []
    const buildQuery = vi.fn().mockImplementation((_client, from, to) => {
      calls.push([from, to])
      return Promise.resolve({ data: rows, error: null })
    })
    const result = await fetchAllWithPagination<Row>(buildQuery)
    expect(result).toHaveLength(5)
    expect(calls).toHaveLength(1)
    expect(calls[0]).toEqual([0, ENTRIES_PAGE_SIZE - 1])
  })

  it('fetches two pages when first page is full (1000 rows)', async () => {
    const page1 = makeRows(ENTRIES_PAGE_SIZE, 1)
    const page2 = makeRows(42, ENTRIES_PAGE_SIZE + 1)
    const calls: [number, number][] = []
    const buildQuery = vi
      .fn()
      .mockImplementationOnce((_c, from, to) => {
        calls.push([from, to])
        return Promise.resolve({ data: page1, error: null })
      })
      .mockImplementationOnce((_c, from, to) => {
        calls.push([from, to])
        return Promise.resolve({ data: page2, error: null })
      })

    const result = await fetchAllWithPagination<Row>(buildQuery)
    expect(result).toHaveLength(ENTRIES_PAGE_SIZE + 42)
    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual([0, ENTRIES_PAGE_SIZE - 1])
    expect(calls[1]).toEqual([ENTRIES_PAGE_SIZE, ENTRIES_PAGE_SIZE * 2 - 1])
  })

  it('stops loop when last page has fewer than pageSize rows', async () => {
    const page1 = makeRows(ENTRIES_PAGE_SIZE)
    const page2 = makeRows(1)
    let callCount = 0
    const buildQuery = vi.fn().mockImplementation(() => {
      callCount++
      const data = callCount === 1 ? page1 : page2
      return Promise.resolve({ data, error: null })
    })
    const result = await fetchAllWithPagination<Row>(buildQuery)
    expect(result).toHaveLength(ENTRIES_PAGE_SIZE + 1)
    expect(callCount).toBe(2)
  })

  it('returns empty array when first page is empty', async () => {
    const buildQuery = vi.fn().mockResolvedValue({ data: [], error: null })
    const result = await fetchAllWithPagination<Row>(buildQuery)
    expect(result).toHaveLength(0)
    expect(buildQuery).toHaveBeenCalledOnce()
  })

  it('throws on error in first page — no partial data returned silently', async () => {
    const buildQuery = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    await expect(fetchAllWithPagination<Row>(buildQuery)).rejects.toThrow('DB error')
  })

  it('throws on error in second page — does not return partial first-page data silently', async () => {
    const page1 = makeRows(ENTRIES_PAGE_SIZE)
    let callCount = 0
    const buildQuery = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return Promise.resolve({ data: page1, error: null })
      return Promise.resolve({ data: null, error: new Error('page 2 error') })
    })
    await expect(fetchAllWithPagination<Row>(buildQuery)).rejects.toThrow('page 2 error')
  })

  it('accumulates rows across three pages correctly', async () => {
    const p1 = makeRows(ENTRIES_PAGE_SIZE, 1)
    const p2 = makeRows(ENTRIES_PAGE_SIZE, ENTRIES_PAGE_SIZE + 1)
    const p3 = makeRows(7, ENTRIES_PAGE_SIZE * 2 + 1)
    let callCount = 0
    const buildQuery = vi.fn().mockImplementation(() => {
      callCount++
      const data = callCount === 1 ? p1 : callCount === 2 ? p2 : p3
      return Promise.resolve({ data, error: null })
    })
    const result = await fetchAllWithPagination<Row>(buildQuery)
    expect(result).toHaveLength(ENTRIES_PAGE_SIZE * 2 + 7)
    expect(callCount).toBe(3)
  })
})
