import { findContractorEntries } from '../repositories/contractors.repository'
import type {
  Contractor,
  ContractorEntry,
  ContractorEntryRecord,
  ContractorProject,
  ContractorSort,
  ContractorsViewModel,
} from '../types/contractor.types'

// ─── Name normalisation ───────────────────────────────────────────────────────

/**
 * Normalises a raw contractor_name string:
 * - trim leading/trailing whitespace
 * - collapse repeated internal spaces to one
 */
export function normaliseName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

/**
 * Builds the deduplication key for a normalised name:
 * - Latin characters are lowercased (case-insensitive merge for English names)
 * - Arabic (and other non-Latin) characters are kept as-is
 *   (two different Arabic names must never be merged)
 *
 * Examples:
 *   "Mohamed Ali" → "mohamed ali"
 *   "محمد علي"    → "محمد علي"  (unchanged)
 *   "ABC Corp"    → "abc corp"
 */
export function buildContractorKey(normalisedName: string): string {
  // Replace only ASCII letters with their lowercase — leaves Arabic untouched
  return normalisedName.replace(/[A-Za-z]/g, (c) => c.toLowerCase())
}

// ─── Amount parsing ───────────────────────────────────────────────────────────

/**
 * Converts a raw DB amount (number | string) to a non-negative finite number.
 * Non-parseable or negative values are treated as 0 — consistent with how the
 * rest of the codebase handles amounts (see project entry mappers).
 */
export function parseAmount(raw: number | string | null | undefined): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return 0
  return n
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

/**
 * Builds the Contractor[] directory from raw DB records.
 * All grouping, dedup, and aggregation happens here — no logic in components.
 * Does not mutate the input array.
 */
export function buildContractors(records: ContractorEntryRecord[]): Contractor[] {
  // Map: dedup key → mutable accumulator
  const map = new Map<
    string,
    {
      name: string
      key: string
      totalIncome: number
      totalExpense: number
      latestActivityDate: string
      projectMap: Map<string, ContractorProject>
      entries: ContractorEntry[]
    }
  >()

  for (const record of records) {
    // Skip null / empty contractor names
    if (!record.contractor_name || !record.contractor_name.trim()) continue

    const name = normaliseName(record.contractor_name)
    const key = buildContractorKey(name)
    const amount = parseAmount(record.amount)

    const entry: ContractorEntry = {
      id: record.id,
      entryDate: record.entry_date,
      entryType: record.entry_type,
      amount,
      description: record.description?.trim() ?? '',
      seq: record.entry_number,
      projectId: record.project_id,
      projectName: record.projects?.name ?? '',
    }

    const existing = map.get(key)
    if (existing) {
      if (entry.entryType === 'income') existing.totalIncome += amount
      else existing.totalExpense += amount

      if (entry.entryDate > existing.latestActivityDate) {
        existing.latestActivityDate = entry.entryDate
      }

      if (record.project_id && record.projects) {
        existing.projectMap.set(record.project_id, {
          id: record.project_id,
          name: record.projects.name,
        })
      }

      existing.entries.push(entry)
    } else {
      const projectMap = new Map<string, ContractorProject>()
      if (record.project_id && record.projects) {
        projectMap.set(record.project_id, {
          id: record.project_id,
          name: record.projects.name,
        })
      }

      map.set(key, {
        name,
        key,
        totalIncome: entry.entryType === 'income' ? amount : 0,
        totalExpense: entry.entryType === 'expense' ? amount : 0,
        latestActivityDate: entry.entryDate,
        projectMap,
        entries: [entry],
      })
    }
  }

  return Array.from(map.values()).map((acc) => ({
    name: acc.name,
    key: acc.key,
    entryCount: acc.entries.length,
    projectCount: acc.projectMap.size,
    totalIncome: acc.totalIncome,
    totalExpense: acc.totalExpense,
    netMovement: acc.totalIncome - acc.totalExpense,
    latestActivityDate: acc.latestActivityDate,
    projects: Array.from(acc.projectMap.values()),
    entries: acc.entries,
  }))
}

// ─── Search ───────────────────────────────────────────────────────────────────

/**
 * Filters contractors by a search query against their name.
 * Case-insensitive for Latin characters; Arabic compared directly.
 * Returns a new array — does not mutate input.
 */
export function searchContractors(contractors: Contractor[], query: string): Contractor[] {
  const q = query.trim()
  if (!q) return contractors
  const lq = q.replace(/[A-Za-z]/g, (c) => c.toLowerCase())
  return contractors.filter((c) => c.key.includes(lq) || c.name.includes(q))
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

/**
 * Sorts a list of contractors by the given criterion.
 * Returns a new array — does not mutate input.
 */
export function sortContractors(contractors: Contractor[], sort: ContractorSort): Contractor[] {
  return [...contractors].sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name, 'ar')
      case 'expense':
        return b.totalExpense - a.totalExpense
      case 'entries':
        return b.entryCount - a.entryCount
      case 'latest':
        return b.latestActivityDate.localeCompare(a.latestActivityDate)
    }
  })
}

// ─── ViewModel builder ────────────────────────────────────────────────────────

export function buildContractorsViewModel(contractors: Contractor[]): ContractorsViewModel {
  const uniqueProjectIds = new Set(contractors.flatMap((c) => c.projects.map((p) => p.id)))

  return {
    contractors,
    totalContractors: contractors.length,
    totalExpense: contractors.reduce((s, c) => s + c.totalExpense, 0),
    totalProjects: uniqueProjectIds.size,
    totalEntries: contractors.reduce((s, c) => s + c.entryCount, 0),
  }
}

// ─── Public async API ─────────────────────────────────────────────────────────

export async function getContractors(): Promise<Contractor[]> {
  const records = await findContractorEntries()
  return buildContractors(records)
}
