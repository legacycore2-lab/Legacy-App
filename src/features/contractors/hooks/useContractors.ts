import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { isPermissionError, toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildContractorsViewModel,
  getContractors,
  searchContractors,
  sortContractors,
  watchContractors,
} from '../services/contractors.service'
import type { Contractor, ContractorSort, ContractorsViewModel } from '../types/contractor.types'

const CONTRACTORS_QUERY_KEY = ['contractors'] as const

export function useContractors(): {
  viewModel: ContractorsViewModel | null
  selectedContractor: Contractor | null
  selectContractor: (contractor: Contractor | null) => void
  query: string
  setQuery: (query: string) => void
  sort: ContractorSort
  setSort: (sort: ContractorSort) => void
  isLoading: boolean
  error: string
  isPermissionDenied: boolean
} {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<ContractorSort>('expense')
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const {
    data: allContractors,
    isLoading,
    error,
  } = useQuery({
    queryKey: CONTRACTORS_QUERY_KEY,
    queryFn: getContractors,
    staleTime: 60_000,
  })

  useEffect(
    () => watchContractors(() => void queryClient.invalidateQueries({ queryKey: CONTRACTORS_QUERY_KEY })),
    [queryClient],
  )

  const filteredContractors = useMemo(() => {
    if (!allContractors) return null
    return sortContractors(searchContractors(allContractors, query), sort)
  }, [allContractors, query, sort])

  const viewModel: ContractorsViewModel | null = filteredContractors
    ? buildContractorsViewModel(filteredContractors)
    : null

  const selectedContractor: Contractor | null = useMemo(() => {
    if (!selectedKey || !filteredContractors) return null
    return filteredContractors.find((contractor) => contractor.key === selectedKey) ?? null
  }, [selectedKey, filteredContractors])

  function selectContractor(contractor: Contractor | null) {
    setSelectedKey(contractor?.key ?? null)
  }

  return {
    viewModel,
    selectedContractor,
    selectContractor,
    query,
    setQuery,
    sort,
    setSort,
    isLoading,
    error: error ? toErrorMessage(error, 'تعذر تحميل بيانات المقاولين.') : '',
    isPermissionDenied: isPermissionError(error),
  }
}
