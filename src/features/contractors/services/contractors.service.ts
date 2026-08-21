import { findContractorEntries, subscribeToContractorChanges } from '../repositories/contractors.repository'
import type {
  Contractor,
  ContractorEntriesPage,
  ContractorEntry,
  ContractorEntryFilters,
  ContractorEntryRecord,
  ContractorProject,
  ContractorSort,
  ContractorsViewModel,
} from '../types/contractor.types'

import {
  buildContractorKey,
  normaliseName,
  normalizeEntryType,
  parseAmount,
} from '../../../shared/contractors-helpers'
import { effectiveFinancialAmount } from '../../../shared/finance/amount'

export const CONTRACTOR_ENTRIES_PAGE_SIZE = 20

export function buildContractors(records: ContractorEntryRecord[]): Contractor[] {
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
    if (!record.contractor_name || !record.contractor_name.trim()) continue

    const name = normaliseName(record.contractor_name)
    const key = buildContractorKey(name)
    const amount = parseAmount(record.amount)
    const effectiveAmount = effectiveFinancialAmount(amount, record.is_reversal === true)
    const entryType = normalizeEntryType(record.entry_type)

    const entry: ContractorEntry = {
      id: record.id,
      entryDate: record.entry_date,
      entryType: entryType ?? 'unknown',
      amount,
      isReversal: record.is_reversal === true,
      description: record.description?.trim() ?? '',
      seq: record.entry_number,
      projectId: record.project_id,
      projectName: record.projects?.name ?? '',
    }

    const existing = map.get(key)
    if (existing) {
      if (entryType === 'income') existing.totalIncome += effectiveAmount
      else if (entryType === 'expense') existing.totalExpense += effectiveAmount

      if (entry.entryDate > existing.latestActivityDate) existing.latestActivityDate = entry.entryDate

      if (record.project_id && record.projects) {
        existing.projectMap.set(record.project_id, { id: record.project_id, name: record.projects.name })
      }

      existing.entries.push(entry)
    } else {
      const projectMap = new Map<string, ContractorProject>()
      if (record.project_id && record.projects) {
        projectMap.set(record.project_id, { id: record.project_id, name: record.projects.name })
      }

      map.set(key, {
        name,
        key,
        totalIncome: entryType === 'income' ? effectiveAmount : 0,
        totalExpense: entryType === 'expense' ? effectiveAmount : 0,
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
    projects: Array.from(acc.projectMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ar')),
    entries: [...acc.entries].sort((a, b) => {
      const byDate = b.entryDate.localeCompare(a.entryDate)
      if (byDate !== 0) return byDate
      return (b.seq ?? 0) - (a.seq ?? 0)
    }),
  }))
}

export function searchContractors(contractors: Contractor[], query: string): Contractor[] {
  const q = query.trim()
  if (!q) return contractors
  const lq = q.replace(/[A-Za-z]/g, (c) => c.toLowerCase())
  return contractors.filter((c) => c.key.includes(lq) || c.name.includes(q))
}

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

export function filterContractorEntries(
  entries: ContractorEntry[],
  filters: ContractorEntryFilters,
): ContractorEntry[] {
  return entries.filter((entry) => {
    if (filters.projectId && entry.projectId !== filters.projectId) return false
    if (filters.dateFrom && entry.entryDate < filters.dateFrom) return false
    if (filters.dateTo && entry.entryDate > filters.dateTo) return false
    return true
  })
}

export function getContractorEntriesPage(
  contractor: Contractor,
  filters: ContractorEntryFilters,
  page: number,
  pageSize = CONTRACTOR_ENTRIES_PAGE_SIZE,
): ContractorEntriesPage {
  const safePageSize = Math.min(Math.max(Math.trunc(pageSize), 1), 100)
  const filtered = filterContractorEntries(contractor.entries, filters)
  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize))
  const safePage = Math.min(Math.max(1, Math.trunc(page)), totalPages)
  const offset = (safePage - 1) * safePageSize

  return {
    entries: filtered.slice(offset, offset + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    totalPages,
    totalCount,
  }
}

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

export async function getContractors(): Promise<Contractor[]> {
  const records = await findContractorEntries()
  return buildContractors(records)
}

export function watchContractors(onChange: () => void): () => void {
  return subscribeToContractorChanges(onChange)
}

export function extractSelectedContractor(
  contractors: Contractor[],
  selectedKey: string | null,
): Contractor | null {
  if (!selectedKey) return null
  return contractors.find((c) => c.key === selectedKey) ?? null
}
