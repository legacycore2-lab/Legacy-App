import { useAuth } from '../../auth/hooks/useAuth'
import { JournalView } from '../components/JournalView'
import { useJournal } from '../hooks/useJournal'
import '../styles/journal.css'
import '../styles/journal-entry.css'

export function JournalPage() {
  const journal = useJournal()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  return <JournalView {...journal} isAdmin={isAdmin} />
}
