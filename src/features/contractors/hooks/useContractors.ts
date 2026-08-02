import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
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
  // Store only the key — derive the full object from live data to prevent stale state
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

  // Filtered + sorted list — used for both the table and deriving selectedContractor
  const filteredContractors = useMemo(() => {
    if (!allContractors) return null
    return sortContractors(searchContractors(allContractors, query), sort)
  }, [allContractors, query, sort])

  const viewModel: ContractorsViewModel | null = filteredContractors
    ? buildContractorsViewModel(filteredContractors)
    : null

  // Derive selectedContractor from the CURRENT filtered list.
  // If the key is no longer present (refetch removed it, or search hides it),
  // this returns null — the panel auto-closes without any manual cleanup.
  const selectedContractor: Contractor | null = useMemo(() => {
    if (!selectedKey || !filteredContractors) return null
    return filteredContractors.find((c) => c.key === selectedKey) ?? null
  }, [selectedKey, filteredContractors])

  function selectContractor(c: Contractor | null) {
    setSelectedKey(c?.key ?? null)
  }

  // When search changes and the selected contractor is no longer in results,
  // selectedContractor already becomes null via the derivation above.
  // No explicit reset needed — the useMemo handles it reactively.

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
  }
}
