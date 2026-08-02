import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  buildContractorsViewModel,
  getContractors,
  searchContractors,
  sortContractors,
} from '../services/contractors.service'
import type { Contractor, ContractorSort, ContractorsViewModel } from '../types/contractor.types'

const CONTRACTORS_QUERY_KEY = ['contractors'] as const

export function useContractors(): {
  viewModel: ContractorsViewModel | null
  selectedContractor: Contractor | null
  selectContractor: (c: Contractor | null) => void
  query: string
  setQuery: (q: string) => void
  sort: ContractorSort
  setSort: (s: ContractorSort) => void
  isLoading: boolean
  error: string
} {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<ContractorSort>('expense')
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null)

  const {
    data: allContractors,
    isLoading,
    error,
  } = useQuery({
    queryKey: CONTRACTORS_QUERY_KEY,
    queryFn: getContractors,
    staleTime: 60_000,
  })

  const viewModel: ContractorsViewModel | null = allContractors
    ? buildContractorsViewModel(sortContractors(searchContractors(allContractors, query), sort))
    : null

  return {
    viewModel,
    selectedContractor,
    selectContractor: setSelectedContractor,
    query,
    setQuery,
    sort,
    setSort,
    isLoading,
    error: error ? toErrorMessage(error, 'تعذر تحميل بيانات المقاولين.') : '',
  }
}
