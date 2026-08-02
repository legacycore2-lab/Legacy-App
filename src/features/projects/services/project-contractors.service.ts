import {
  buildContractorKey,
  normaliseName,
  normalizeEntryType,
  parseAmount,
} from '../../../shared/contractors-helpers'
import { findProjectContractorEntries } from '../repositories/project-contractors.repository'
import type {
  ContractorEntry,
  ProjectContractor,
  ProjectContractorRecord,
  ProjectContractorsViewModel,
} from '../types/project-contractor.types'

// ─── Aggregation ──────────────────────────────────────────────────────────────

/**
 * Builds ProjectContractor[] from raw records already scoped to a project.
 * Reuses shared normalisation helpers (shared/contractors-helpers).
 * Does not mutate input.
 *
 * unknown entry_type:
 *   - entryType = 'unknown' in the entry (shown neutrally in UI)
 *   - real amount preserved in entry for display
 *   - excluded from totalIncome, totalExpense, netMovement
 */
export function buildProjectContractors(records: ProjectContractorRecord[]): ProjectContractor[] {
  type Acc = {
    name: string
    key: string
    totalIncome: number
    totalExpense: number
    latestActivityDate: string
    entries: ContractorEntry[]
  }

  const map = new Map<string, Acc>()

  for (const record of records) {
    if (!record.contractor_name || !record.contractor_name.trim()) continue

    const name = normaliseName(record.contractor_name)
    const key = buildContractorKey(name)
    const amount = parseAmount(record.amount)
    const entryType = normalizeEntryType(record.entry_type)

    const entry: ContractorEntry = {
      id: record.id,
      entryDate: record.entry_date,
      entryType: entryType ?? 'unknown',
      amount, // real amount always — exclusion handled in totals only
      description: record.description?.trim() ?? '',
      seq: record.entry_number,
      projectId: record.project_id,
      projectName: record.projects?.name ?? '',
    }

    const existing = map.get(key)
    if (existing) {
      if (entryType === 'income') existing.totalIncome += amount
      else if (entryType === 'expense') existing.totalExpense += amount
      if (entry.entryDate > existing.latestActivityDate) {
        existing.latestActivityDate = entry.entryDate
      }
      existing.entries.push(entry)
    } else {
      map.set(key, {
        name,
        key,
        totalIncome: entryType === 'income' ? amount : 0,
        totalExpense: entryType === 'expense' ? amount : 0,
        latestActivityDate: entry.entryDate,
        entries: [entry],
      })
    }
  }

  return Array.from(map.values()).map((acc) => ({
    name: acc.name,
    key: acc.key,
    entryCount: acc.entries.length,
    totalIncome: acc.totalIncome,
    totalExpense: acc.totalExpense,
    netMovement: acc.totalIncome - acc.totalExpense,
    latestActivityDate: acc.latestActivityDate,
    // Sort entries: newest entryDate first; ties broken by seq descending.
    // Slice creates a new array — input entries array is not mutated.
    entries: acc.entries.slice().sort((a, b) => {
      const dateCmp = b.entryDate.localeCompare(a.entryDate)
      if (dateCmp !== 0) return dateCmp
      return (b.seq ?? 0) - (a.seq ?? 0)
    }),
  }))
}

/**
 * Builds the ViewModel for the project contractors tab.
 * Contractors sorted by totalExpense descending. Does not mutate input.
 */
export function buildProjectContractorsViewModel(
  contractors: ProjectContractor[],
): ProjectContractorsViewModel {
  const sorted = [...contractors].sort((a, b) => b.totalExpense - a.totalExpense)
  return {
    contractors: sorted,
    totalContractors: sorted.length,
    totalExpense: sorted.reduce((s, c) => s + c.totalExpense, 0),
    totalIncome: sorted.reduce((s, c) => s + c.totalIncome, 0),
    totalEntries: sorted.reduce((s, c) => s + c.entryCount, 0),
    hasData: sorted.length > 0,
  }
}

// ─── Public async API ─────────────────────────────────────────────────────────

export async function getProjectContractors(projectId: string): Promise<ProjectContractor[]> {
  const records = await findProjectContractorEntries(projectId)
  return buildProjectContractors(records)
}
