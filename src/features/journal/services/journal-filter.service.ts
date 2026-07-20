import type { JournalEntry, JournalFilters } from '../types/journal.types'

export function filterJournalEntries(entries: JournalEntry[], filters: JournalFilters): JournalEntry[] {
  const query = filters.query.trim().toLocaleLowerCase('ar')
  return entries.filter((entry) => {
    const matchesType = filters.type === 'all' || entry.type === filters.type
    const searchable = [
      entry.projectName,
      entry.category,
      entry.description,
      entry.contractor,
      entry.paymentMethod,
      entry.sequence,
    ]
      .join(' ')
      .toLocaleLowerCase('ar')
    return matchesType && (!query || searchable.includes(query))
  })
}
