import { JournalView } from '../components/JournalView'
import { useJournal } from '../hooks/useJournal'
import '../styles/journal.css'

export function JournalPage() {
  const journal = useJournal()
  return <JournalView {...journal} onFiltersChange={journal.setFilters} />
}
