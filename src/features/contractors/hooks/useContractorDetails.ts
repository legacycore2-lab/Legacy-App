import { useMemo, useState } from 'react'
import { getContractorEntriesPage } from '../services/contractors.service'
import type { Contractor, ContractorEntryFilters } from '../types/contractor.types'

const defaultFilters: ContractorEntryFilters = {
  projectId: '',
  dateFrom: '',
  dateTo: '',
}

type DetailsState = {
  contractorKey: string | null
  page: number
  filters: ContractorEntryFilters
}

export function useContractorDetails(contractor: Contractor | null) {
  const contractorKey = contractor?.key ?? null
  const [state, setState] = useState<DetailsState>({
    contractorKey,
    page: 1,
    filters: defaultFilters,
  })

  const activeState =
    state.contractorKey === contractorKey
      ? state
      : { contractorKey, page: 1, filters: defaultFilters }

  const pageData = useMemo(() => {
    if (!contractor) {
      return {
        entries: [],
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalCount: 0,
      }
    }

    return getContractorEntriesPage(contractor, activeState.filters, activeState.page)
  }, [contractor, activeState.filters, activeState.page])

  const updateFilters = (next: ContractorEntryFilters) => {
    setState({ contractorKey, page: 1, filters: next })
  }

  const resetFilters = () => {
    setState({ contractorKey, page: 1, filters: defaultFilters })
  }

  const goToPreviousPage = () => {
    setState({
      contractorKey,
      filters: activeState.filters,
      page: Math.max(1, pageData.page - 1),
    })
  }

  const goToNextPage = () => {
    setState({
      contractorKey,
      filters: activeState.filters,
      page: Math.min(pageData.totalPages, pageData.page + 1),
    })
  }

  return {
    filters: activeState.filters,
    onFiltersChange: updateFilters,
    onResetFilters: resetFilters,
    entries: pageData.entries,
    page: pageData.page,
    totalPages: pageData.totalPages,
    totalCount: pageData.totalCount,
    onPreviousPage: goToPreviousPage,
    onNextPage: goToNextPage,
  }
}
