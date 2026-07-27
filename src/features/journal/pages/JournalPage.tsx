import { JournalView } from '../components/JournalView'
import { useJournal } from '../hooks/useJournal'
import '../styles/journal.css'
import '../styles/journal-entry.css'
import '../styles/journal-import.css'
import '../styles/journal-import-trigger.css'

export function JournalPage() {
  const journal = useJournal()
  return <JournalView {...journal} />
}
