import { useMemo, useState } from 'react'
import {
  buildReportsCenterViewModel,
  filterReportDefinitions,
} from '../services/reports-center.service'
import { getReportsCenterDefinitions } from '../services/reports-center-navigation.service'
import type { ReportCategory, ReportKey } from '../types/reports-center.types'

export function useReportsCenter() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('all')
  const [selectedReport, setSelectedReport] = useState<ReportKey | null>(null)

  const definitions = useMemo(() => getReportsCenterDefinitions(), [])
  const filteredDefinitions = useMemo(
    () => filterReportDefinitions(definitions, query, selectedCategory),
    [definitions, query, selectedCategory],
  )
  const viewModel = useMemo(
    () => buildReportsCenterViewModel(filteredDefinitions),
    [filteredDefinitions],
  )

  return {
    ...viewModel,
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    selectedReport,
    openReport: setSelectedReport,
    closeReport: () => setSelectedReport(null),
  }
}
