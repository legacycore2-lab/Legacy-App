import { describe, expect, it, vi } from 'vitest'
import { ENTRIES_PAGE_SIZE, fetchAllWithPagination } from './pagination-helpers'

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
    const fetchPage = vi.fn().mockImplementation((from: number, to: number) => {
      calls.push([from, to])
      return Promise.resolve({ data: rows, error: null })
    })
    const result = await fetchAllWithPagination<Row>(fetchPage)
    expect(result).toHaveLength(5)
    expect(calls).toHaveLength(1)
    expect(calls[0]).toEqual([0, ENTRIES_PAGE_SIZE - 1])
  })

  it('fetches two pages when first page is full (1000 rows)', async () => {
    const page1 = makeRows(ENTRIES_PAGE_SIZE, 1)
    const page2 = makeRows(42, ENTRIES_PAGE_SIZE + 1)
    const calls: [number, number][] = []
    const fetchPage = vi
      .fn()
      .mockImplementationOnce((from: number, to: number) => {
        calls.push([from, to])
        return Promise.resolve({ data: page1, error: null })
      })
      .mockImplementationOnce((from: number, to: number) => {
        calls.push([from, to])
        return Promise.resolve({ data: page2, error: null })
      })

    const result = await fetchAllWithPagination<Row>(fetchPage)
    expect(result).toHaveLength(ENTRIES_PAGE_SIZE + 42)
    expect(calls[0]).toEqual([0, ENTRIES_PAGE_SIZE - 1])
    expect(calls[1]).toEqual([ENTRIES_PAGE_SIZE, ENTRIES_PAGE_SIZE * 2 - 1])
  })

  it('stops loop when last page has fewer than pageSize rows', async () => {
    const page1 = makeRows(ENTRIES_PAGE_SIZE)
    const page2 = makeRows(1)
    let n = 0
    const fetchPage = vi
      .fn()
      .mockImplementation(() => Promise.resolve({ data: n++ === 0 ? page1 : page2, error: null }))
    const result = await fetchAllWithPagination<Row>(fetchPage)
    expect(result).toHaveLength(ENTRIES_PAGE_SIZE + 1)
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('returns empty array when first page is empty', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ data: [], error: null })
    expect(await fetchAllWithPagination<Row>(fetchPage)).toHaveLength(0)
    expect(fetchPage).toHaveBeenCalledOnce()
  })

  it('throws on error in first page — no partial data returned silently', async () => {
    const fetchPage = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
    await expect(fetchAllWithPagination<Row>(fetchPage)).rejects.toThrow('DB error')
  })

  it('throws on error in second page — does not return partial first-page data', async () => {
    const page1 = makeRows(ENTRIES_PAGE_SIZE)
    let n = 0
    const fetchPage = vi
      .fn()
      .mockImplementation(() =>
        n++ === 0
          ? Promise.resolve({ data: page1, error: null })
          : Promise.resolve({ data: null, error: new Error('page 2 error') }),
      )
    await expect(fetchAllWithPagination<Row>(fetchPage)).rejects.toThrow('page 2 error')
  })

  it('accumulates rows across three pages correctly', async () => {
    const p1 = makeRows(ENTRIES_PAGE_SIZE, 1)
    const p2 = makeRows(ENTRIES_PAGE_SIZE, ENTRIES_PAGE_SIZE + 1)
    const p3 = makeRows(7, ENTRIES_PAGE_SIZE * 2 + 1)
    let n = 0
    const fetchPage = vi.fn().mockImplementation(() => {
      const data = n === 0 ? p1 : n === 1 ? p2 : p3
      n++
      return Promise.resolve({ data, error: null })
    })
    const result = await fetchAllWithPagination<Row>(fetchPage)
    expect(result).toHaveLength(ENTRIES_PAGE_SIZE * 2 + 7)
    expect(fetchPage).toHaveBeenCalledTimes(3)
  })
})
