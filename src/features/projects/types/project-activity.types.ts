// ─── Raw DB records (repository boundary) ────────────────────────────────────

export type ActivityProjectRecord = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export type ActivityEntryRecord = {
  id: string
  entry_number: number | null
  entry_type: 'income' | 'expense'
  amount: number | string
  description: string | null
  entry_date: string
  project_id: string
}

export type ActivityAttachmentRecord = {
  id: string
  entry_id: string
  file_name: string
  storage_path: string
  created_at: string
}

// ─── Domain events ────────────────────────────────────────────────────────────

export type ProjectCreatedEvent = {
  kind: 'project_created'
  /** ISO timestamp — used for sorting */
  timestamp: string
  projectName: string
}

export type ProjectUpdatedEvent = {
  kind: 'project_updated'
  timestamp: string
  projectName: string
}

export type EntryAddedEvent = {
  kind: 'entry_added'
  timestamp: string
  /** Accounting date — YYYY-MM-DD, no time component */
  entryDate: string
  entryType: 'income' | 'expense'
  seq: number | null
  amount: number
  description: string
}

export type AttachmentUploadedEvent = {
  kind: 'attachment_uploaded'
  timestamp: string
  attachmentId: string
  fileName: string
  entryId: string
  storagePath: string
}

export type ActivityEvent =
  ProjectCreatedEvent | ProjectUpdatedEvent | EntryAddedEvent | AttachmentUploadedEvent

export type ActivityEventKind = ActivityEvent['kind']

// ─── ViewModel ────────────────────────────────────────────────────────────────

export type ActivityGroup = {
  /** Display label: "اليوم" | "أمس" | "DD MMMM YYYY" */
  label: string
  /** YYYY-MM-DD key used for grouping */
  dateKey: string
  events: ActivityEvent[]
}

export type ActivityFilter = 'all' | 'entries' | 'attachments' | 'project'

export type ProjectActivityViewModel = {
  groups: ActivityGroup[]
  totalCount: number
  hasActivity: boolean
}
