import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { filterJournalRows, getJournalReportViewModel } from '../services/reports.service'
import type { JournalReportFilters } from '../types/report.types'

const EMPTY_FILTERS: JournalReportFilters = {
  query: '',
  dateFrom: '',
  dateTo: '',
  projectId: '',
  entryType: 'all',
  contractor: '',
  paymentMethod: '',
}

export function useJournalReport() {
  const [filters, setFilters] = useState<JournalReportFilters>(EMPTY_FILTERS)

  const q = useQuery({
    queryKey: ['reports', 'journal'],
    queryFn: getJournalReportViewModel,
    staleTime: 30_000,
  })

  const allRows = q.data?.rows ?? []
  const rows = filterJournalRows(allRows, filters)

  // re-summarize after filter
  const summary = rows.reduce(
    (acc, row) => {
      if (row.type === 'income') acc.totalIncome += row.amount
      if (row.type === 'expense') acc.totalExpense += row.amount
      acc.netProfit = acc.totalIncome - acc.totalExpense
      acc.entryCount += 1
      return acc
    },
    { totalIncome: 0, totalExpense: 0, netProfit: 0, entryCount: 0 },
  )

  function setFilter<K extends keyof JournalReportFilters>(key: K, value: JournalReportFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS)
  }

  return {
    rows,
    summary,
    filters,
    setFilter,
    resetFilters,
    contractors: q.data?.contractors ?? [],
    paymentMethods: q.data?.paymentMethods ?? [],
    isLoading: q.isLoading,
    error: q.error ? toErrorMessage(q.error, 'تعذر تحميل تقرير القيود.') : '',
    refresh: q.refetch,
  }
}
