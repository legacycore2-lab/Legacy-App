import { useEffect, useMemo, useState } from 'react'
import { getJournalEntries } from '../services/journal.service'
import type { JournalEntry, JournalFilters } from '../types/journal.types'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { filterJournalEntries } from '../services/journal-filter.service'

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<JournalFilters>({ query: '', type: 'all' })

  useEffect(() => {
    let active = true
    getJournalEntries()
      .then((data) => active && setEntries(data))
      .catch((loadError) => active && setError(toErrorMessage(loadError, 'تعذر تحميل القيود حاليًا.')))
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [])

  const filteredEntries = useMemo(() => filterJournalEntries(entries, filters), [entries, filters])

  return { entries: filteredEntries, allEntries: entries, filters, setFilters, isLoading, error }
}
