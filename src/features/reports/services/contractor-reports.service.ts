import { normalizeEntryType } from '../../../shared/contractors-helpers'
import { findContractorReportEntries } from '../repositories/reports.repository'
import type {
  ContractorCategoryRow,
  ContractorDataQualityIssueKind,
  ContractorDataQualityRow,
  ContractorMonthlyRow,
  ContractorPaymentMethodRow,
  ContractorProjectRow,
  ContractorReportEntry,
  ContractorReportEntryRecord,
  ContractorReportsFilters,
  ContractorReportsOverview,
  ContractorReportsViewModel,
  ContractorSummaryRow,
} from '../types/contractor-reports.types'
import { parseSignedReportAmount } from './report-amount'

const MISSING_CONTRACTOR = 'بدون اسم مقاول'
const MISSING_PROJECT = 'بدون مشروع'
const MISSING_CATEGORY = 'بدون بند'
const MISSING_PAYMENT_METHOD = 'غير محددة'

function resolveProjectName(project: ContractorReportEntryRecord['project']): string {
  if (!project) return MISSING_PROJECT
  if (Array.isArray(project)) return project[0]?.name ?? MISSING_PROJECT
  return project.name || MISSING_PROJECT
}

function roundPercentage(value: number): number {
  return Math.round(value * 100) / 100
}

export function mapContractorReportEntry(record: ContractorReportEntryRecord): ContractorReportEntry {
  return {
    id: record.id,
    entryNumber: record.entry_number,
    entryDate: record.entry_date,
    entryType: normalizeEntryType(record.entry_type) ?? 'unknown',
    amount: parseSignedReportAmount(record.amount),
    contractorName: record.contractor_name?.trim() || MISSING_CONTRACTOR,
    category: record.category?.trim() || MISSING_CATEGORY,
    description: record.description?.trim() || '—',
    paymentMethod: record.payment_method?.trim() || MISSING_PAYMENT_METHOD,
    projectId: record.project_id ?? '',
    projectName: resolveProjectName(record.project),
  }
}

export function filterContractorReportEntries(
  entries: ContractorReportEntry[],
  filters: ContractorReportsFilters,
): ContractorReportEntry[] {
  const query = filters.query.trim().toLocaleLowerCase('ar-EG')

  return entries.filter((entry) => {
    if (filters.contractorName && entry.contractorName !== filters.contractorName) return false
    if (filters.projectId && entry.projectId !== filters.projectId) return false
    if (filters.category && entry.category !== filters.category) return false
    if (filters.entryType !== 'all' && entry.entryType !== filters.entryType) return false
    if (filters.dateFrom && entry.entryDate < filters.dateFrom) return false
    if (filters.dateTo && entry.entryDate > filters.dateTo) return false
    if (!query) return true

    return [
      entry.contractorName,
      entry.projectName,
      entry.category,
      entry.description,
      entry.paymentMethod,
    ].some((value) => value.toLocaleLowerCase('ar-EG').includes(query))
  })
}

export function buildContractorSummaryRows(entries: ContractorReportEntry[]): ContractorSummaryRow[] {
  const groups = new Map<
    string,
    {
      totalIncome: number
      totalExpense: number
      entryCount: number
      movementTotal: number
      projects: Set<string>
      lastActivityDate: string | null
    }
  >()

  for (const entry of entries) {
    if (entry.contractorName === MISSING_CONTRACTOR) continue
    const current = groups.get(entry.contractorName) ?? {
      totalIncome: 0,
      totalExpense: 0,
      entryCount: 0,
      movementTotal: 0,
      projects: new Set<string>(),
      lastActivityDate: null,
    }

    if (entry.entryType === 'income') current.totalIncome += entry.amount
    if (entry.entryType === 'expense') current.totalExpense += entry.amount
    current.movementTotal += entry.amount
    current.entryCount += 1
    if (entry.projectId) current.projects.add(entry.projectId)
    if (!current.lastActivityDate || entry.entryDate > current.lastActivityDate) {
      current.lastActivityDate = entry.entryDate
    }
    groups.set(entry.contractorName, current)
  }

  return Array.from(groups.entries())
    .map(([contractorName, totals]) => ({
      contractorName,
      totalIncome: totals.totalIncome,
      totalExpense: totals.totalExpense,
      netMovement: totals.totalIncome - totals.totalExpense,
      entryCount: totals.entryCount,
      projectCount: totals.projects.size,
      averageEntryAmount: totals.entryCount > 0 ? totals.movementTotal / totals.entryCount : 0,
      lastActivityDate: totals.lastActivityDate,
    }))
    .sort((a, b) => b.totalExpense - a.totalExpense || a.contractorName.localeCompare(b.contractorName, 'ar'))
}

export function buildContractorProjectRows(entries: ContractorReportEntry[]): ContractorProjectRow[] {
  const groups = new Map<string, ContractorProjectRow>()

  for (const entry of entries) {
    if (entry.contractorName === MISSING_CONTRACTOR) continue
    const key = `${entry.contractorName}\u0000${entry.projectId || MISSING_PROJECT}`
    const current = groups.get(key) ?? {
      contractorName: entry.contractorName,
      projectId: entry.projectId,
      projectName: entry.projectName,
      totalIncome: 0,
      totalExpense: 0,
      netMovement: 0,
      entryCount: 0,
    }
    if (entry.entryType === 'income') current.totalIncome += entry.amount
    if (entry.entryType === 'expense') current.totalExpense += entry.amount
    current.netMovement = current.totalIncome - current.totalExpense
    current.entryCount += 1
    groups.set(key, current)
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.totalExpense - a.totalExpense || a.contractorName.localeCompare(b.contractorName, 'ar'),
  )
}

export function buildContractorCategoryRows(entries: ContractorReportEntry[]): ContractorCategoryRow[] {
  const totalsByContractor = new Map<string, number>()
  const groups = new Map<string, Omit<ContractorCategoryRow, 'percentageOfContractorExpense'>>()

  for (const entry of entries) {
    if (entry.contractorName === MISSING_CONTRACTOR || entry.entryType !== 'expense') continue
    totalsByContractor.set(
      entry.contractorName,
      (totalsByContractor.get(entry.contractorName) ?? 0) + entry.amount,
    )
    const key = `${entry.contractorName}\u0000${entry.category}`
    const current = groups.get(key) ?? {
      contractorName: entry.contractorName,
      category: entry.category,
      totalExpense: 0,
      entryCount: 0,
    }
    current.totalExpense += entry.amount
    current.entryCount += 1
    groups.set(key, current)
  }

  return Array.from(groups.values())
    .map((row) => ({
      ...row,
      percentageOfContractorExpense: roundPercentage(
        (row.totalExpense / (totalsByContractor.get(row.contractorName) || 1)) * 100,
      ),
    }))
    .sort((a, b) => b.totalExpense - a.totalExpense)
}

export function buildContractorMonthlyRows(entries: ContractorReportEntry[]): ContractorMonthlyRow[] {
  const groups = new Map<string, ContractorMonthlyRow>()

  for (const entry of entries) {
    if (entry.contractorName === MISSING_CONTRACTOR) continue
    const monthKey = entry.entryDate.slice(0, 7)
    if (!/^\d{4}-\d{2}$/.test(monthKey)) continue
    const key = `${entry.contractorName}\u0000${monthKey}`
    const current = groups.get(key) ?? {
      contractorName: entry.contractorName,
      monthKey,
      totalIncome: 0,
      totalExpense: 0,
      netMovement: 0,
      entryCount: 0,
    }
    if (entry.entryType === 'income') current.totalIncome += entry.amount
    if (entry.entryType === 'expense') current.totalExpense += entry.amount
    current.netMovement = current.totalIncome - current.totalExpense
    current.entryCount += 1
    groups.set(key, current)
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.monthKey.localeCompare(a.monthKey) || a.contractorName.localeCompare(b.contractorName, 'ar'),
  )
}

export function buildContractorPaymentMethodRows(
  entries: ContractorReportEntry[],
): ContractorPaymentMethodRow[] {
  const totalsByContractor = new Map<string, number>()
  const groups = new Map<string, Omit<ContractorPaymentMethodRow, 'percentageOfContractorMovement'>>()

  for (const entry of entries) {
    if (entry.contractorName === MISSING_CONTRACTOR) continue
    if (entry.entryType !== 'expense') continue
    totalsByContractor.set(
      entry.contractorName,
      (totalsByContractor.get(entry.contractorName) ?? 0) + entry.amount,
    )
    const key = `${entry.contractorName}\u0000${entry.paymentMethod}`
    const current = groups.get(key) ?? {
      contractorName: entry.contractorName,
      paymentMethod: entry.paymentMethod,
      totalAmount: 0,
      entryCount: 0,
    }
    current.totalAmount += entry.amount
    current.entryCount += 1
    groups.set(key, current)
  }

  return Array.from(groups.values())
    .map((row) => ({
      ...row,
      percentageOfContractorMovement: roundPercentage(
        (row.totalAmount / (totalsByContractor.get(row.contractorName) || 1)) * 100,
      ),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
}

const QUALITY_LABELS: Record<ContractorDataQualityIssueKind, string> = {
  'missing-contractor': 'قيود بدون اسم مقاول',
  'missing-project': 'قيود مقاولين بدون مشروع',
  'missing-category': 'قيود مقاولين بدون بند',
  'missing-payment-method': 'قيود مقاولين بدون طريقة دفع',
  'unknown-entry-type': 'قيود مقاولين بنوع غير معروف',
}

export function buildContractorDataQualityRows(entries: ContractorReportEntry[]): ContractorDataQualityRow[] {
  const groups = new Map<ContractorDataQualityIssueKind, { count: number; totalAmount: number }>()
  const add = (kind: ContractorDataQualityIssueKind, amount: number) => {
    const current = groups.get(kind) ?? { count: 0, totalAmount: 0 }
    current.count += 1
    current.totalAmount += amount
    groups.set(kind, current)
  }

  for (const entry of entries) {
    if (entry.contractorName === MISSING_CONTRACTOR) add('missing-contractor', entry.amount)
    if (entry.contractorName !== MISSING_CONTRACTOR && !entry.projectId) add('missing-project', entry.amount)
    if (entry.contractorName !== MISSING_CONTRACTOR && entry.category === MISSING_CATEGORY) {
      add('missing-category', entry.amount)
    }
    if (entry.contractorName !== MISSING_CONTRACTOR && entry.paymentMethod === MISSING_PAYMENT_METHOD) {
      add('missing-payment-method', entry.amount)
    }
    if (entry.contractorName !== MISSING_CONTRACTOR && entry.entryType === 'unknown') {
      add('unknown-entry-type', entry.amount)
    }
  }

  return Array.from(groups.entries()).map(([kind, totals]) => ({
    kind,
    label: QUALITY_LABELS[kind],
    ...totals,
  }))
}

export function buildContractorReportsOverview(
  contractors: ContractorSummaryRow[],
): ContractorReportsOverview {
  const totals = contractors.reduce(
    (acc, contractor) => ({
      totalIncome: acc.totalIncome + contractor.totalIncome,
      totalExpense: acc.totalExpense + contractor.totalExpense,
      entryCount: acc.entryCount + contractor.entryCount,
    }),
    { totalIncome: 0, totalExpense: 0, entryCount: 0 },
  )
  const projects = new Set<string>()

  return {
    contractorCount: contractors.length,
    activeContractorCount: contractors.filter((contractor) => contractor.entryCount > 0).length,
    totalIncome: totals.totalIncome,
    totalExpense: totals.totalExpense,
    netMovement: totals.totalIncome - totals.totalExpense,
    entryCount: totals.entryCount,
    projectCount: projects.size,
    topCostContractor: contractors[0] ?? null,
  }
}

export function buildContractorReportsViewModel(
  records: ContractorReportEntryRecord[],
  filters: ContractorReportsFilters,
): ContractorReportsViewModel {
  const allEntries = records.map(mapContractorReportEntry)
  const entries = filterContractorReportEntries(allEntries, filters)
  const contractors = buildContractorSummaryRows(entries)
  const contractorProjects = buildContractorProjectRows(entries)
  const overview = buildContractorReportsOverview(contractors)
  overview.projectCount = new Set(contractorProjects.map((row) => row.projectId).filter(Boolean)).size

  const projectMap = new Map<string, string>()
  for (const entry of allEntries) {
    if (entry.projectId) projectMap.set(entry.projectId, entry.projectName)
  }

  return {
    overview,
    contractors,
    entries,
    contractorProjects,
    categories: buildContractorCategoryRows(entries),
    monthlyActivity: buildContractorMonthlyRows(entries),
    paymentMethods: buildContractorPaymentMethodRows(entries),
    dataQuality: buildContractorDataQualityRows(allEntries),
    contractorOptions: Array.from(
      new Set(allEntries.map((entry) => entry.contractorName).filter((name) => name !== MISSING_CONTRACTOR)),
    ).sort((a, b) => a.localeCompare(b, 'ar')),
    projectOptions: Array.from(projectMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar')),
    categoryOptions: Array.from(
      new Set(allEntries.map((entry) => entry.category).filter((category) => category !== MISSING_CATEGORY)),
    ).sort((a, b) => a.localeCompare(b, 'ar')),
  }
}

export async function loadContractorReportsData(
  filters: ContractorReportsFilters,
): Promise<ContractorReportsViewModel> {
  const records = await findContractorReportEntries()
  return buildContractorReportsViewModel(records, filters)
}
