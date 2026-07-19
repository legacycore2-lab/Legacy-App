import { useEffect, useMemo, useState } from 'react'
import { getJournalEntries } from '../services/journal.service'
import type { JournalEntry, JournalFilters } from '../types/journal.types'

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState<JournalFilters>({ query: '', type: 'all' })

  useEffect(() => {
    let active = true
    getJournalEntries()
      .then((data) => active && setEntries(data))
      .catch(() => active && setError('تعذر تحميل القيود حاليًا.'))
      .finally(() => active && setIsLoading(false))
    return () => { active = false }
  }, [])

  const filteredEntries = useMemo(() => {
    const query = filters.query.trim().toLocaleLowerCase('ar')
    return entries.filter((entry) => {
      const matchesType = filters.type === 'all' || entry.type === filters.type
      const searchable = [entry.projectName, entry.category, entry.description, entry.contractor, entry.paymentMethod, entry.sequence].join(' ').toLocaleLowerCase('ar')
      return matchesType && (!query || searchable.includes(query))
    })
  }, [entries, filters])

  return { entries: filteredEntries, allEntries: entries, filters, setFilters, isLoading, error }
}
