import type { JournalEntry } from '../types/journal.types'
import { findJournalEntries } from '../repositories/journal.repository'
import { mapJournalEntry } from './journal.mapper'

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const records = await findJournalEntries()
  return records.map(mapJournalEntry)
}
