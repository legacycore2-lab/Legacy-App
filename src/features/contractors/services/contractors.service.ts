import { findContractorEntries } from '../repositories/contractors.repository'
import type {
  Contractor,
  ContractorEntry,
  ContractorEntryRecord,
  ContractorProject,
  ContractorSort,
  ContractorsViewModel,
} from '../types/contractor.types'

// ─── Re-export shared helpers for consumers that import from this module ─────

export {
  buildContractorKey,
  normaliseName,
  normalizeEntryType,
  parseAmount,
} from '../../../shared/contractors-helpers'

import {
  buildContractorKey,
  normaliseName,
  normalizeEntryType,
  parseAmount,
} from '../../../shared/contractors-helpers'

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
    const entryType = normalizeEntryType(record.entry_type)

    // Unknown entry_type: keep the entry in the list (documented) but exclude
    // it from financial aggregation — never treat an unknown type as expense.
    const entry: ContractorEntry = {
      id: record.id,
      entryDate: record.entry_date,
      // Preserve null as 'unknown' in the UI type — never coerce to 'expense'
      entryType: entryType ?? 'unknown',
      // Show the real amount in the details panel — just don't aggregate it
      amount,
      description: record.description?.trim() ?? '',
      seq: record.entry_number,
      projectId: record.project_id,
      projectName: record.projects?.name ?? '',
    }

    const existing = map.get(key)
    if (existing) {
      // Only aggregate known types — unknown entry_type contributes 0 to both totals
      if (entryType === 'income') existing.totalIncome += amount
      else if (entryType === 'expense') existing.totalExpense += amount

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
        totalIncome: entryType === 'income' ? amount : 0,
        totalExpense: entryType === 'expense' ? amount : 0,
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

// ─── Selected contractor derivation (pure, testable) ─────────────────────────

/**
 * Derives the selected Contractor from a list by key.
 * Returns null if the key is not found — handles refetch removal and
 * search-hiding gracefully without any manual state cleanup.
 */
export function extractSelectedContractor(
  contractors: Contractor[],
  selectedKey: string | null,
): Contractor | null {
  if (!selectedKey) return null
  return contractors.find((c) => c.key === selectedKey) ?? null
}
