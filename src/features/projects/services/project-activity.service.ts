import {
  findActivityAttachments,
  findActivityEntries,
  findActivityProject,
  getActivityAttachmentUrl,
} from '../repositories/project-activity.repository'
import type {
  ActivityEvent,
  ActivityFilter,
  ActivityGroup,
  ProjectActivityViewModel,
} from '../types/project-activity.types'

// ─── Date validation ──────────────────────────────────────────────────────────

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Returns true only if dateKey is a real calendar date in YYYY-MM-DD format.
 *
 * Two-step validation:
 * 1. Regex ensures the string is exactly YYYY-MM-DD with digits.
 * 2. Date.UTC round-trip: constructs a UTC date and re-serialises it — if the
 *    OS normalises the date (e.g. Feb 31 → Mar 3), the round-trip differs from
 *    the input, so we reject it. This catches impossible dates like 2026-02-31
 *    while correctly accepting leap-year dates like 2028-02-29.
 */
export function isValidDateKey(dateKey: string): boolean {
  if (!ISO_DATE_RE.test(dateKey)) return false
  const parts = dateKey.split('-').map(Number)
  const year = parts[0] ?? 0
  const month = parts[1] ?? 0
  const day = parts[2] ?? 0
  const utc = new Date(Date.UTC(year, month - 1, day))
  return utc.getUTCFullYear() === year && utc.getUTCMonth() + 1 === month && utc.getUTCDate() === day
}

/**
 * Extracts YYYY-MM-DD from an ISO timestamp without constructing a local Date.
 * Works for both "YYYY-MM-DD" and "YYYY-MM-DDTHH:mm:ss…Z" strings.
 */
export function extractDateKey(timestamp: string): string {
  return timestamp.slice(0, 10)
}

/**
 * Builds a UTC midnight Date from a YYYY-MM-DD key.
 * Using Date.UTC avoids local-timezone month/day drift.
 */
function utcDateFromKey(dateKey: string): Date {
  const parts = dateKey.split('-').map(Number)
  const year = parts[0] ?? 0
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  return new Date(Date.UTC(year, month - 1, day))
}

const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

/**
 * Returns a human-readable group label relative to today.
 * "today" and "yesterday" are calculated in UTC to stay consistent with
 * extractDateKey — both operate on calendar dates, not local wall time.
 */
export function buildGroupLabel(dateKey: string, todayKey: string): string {
  const parts = todayKey.split('-').map(Number)
  const yesterdayUtc = new Date(Date.UTC(parts[0] ?? 0, (parts[1] ?? 1) - 1, (parts[2] ?? 1) - 1))
  const yesterdayKey = yesterdayUtc.toISOString().slice(0, 10)

  if (dateKey === todayKey) return 'اليوم'
  if (dateKey === yesterdayKey) return 'أمس'
  return dateFormatter.format(utcDateFromKey(dateKey))
}

// ─── Event builders ───────────────────────────────────────────────────────────

/**
 * Builds all raw ActivityEvents for a project from three sources,
 * sorted newest-first by timestamp.
 *
 * Important: entries use entry_date (accounting date) as the timestamp
 * for grouping, but the display explicitly shows it as an accounting date —
 * no time-of-day is fabricated for them.
 *
 * No mutation of input arrays.
 */
export function buildActivityEvents(
  projectRecord: { name: string; created_at: string; updated_at: string },
  entryRecords: Array<{
    id: string
    entry_number: number | null
    entry_type: 'income' | 'expense'
    amount: number | string
    description: string | null
    entry_date: string
  }>,
  attachmentRecords: Array<{
    id: string
    entry_id: string
    file_name: string
    storage_path: string
    created_at: string
  }>,
): ActivityEvent[] {
  const events: ActivityEvent[] = []

  // ── Project events ──
  if (projectRecord.created_at) {
    events.push({
      kind: 'project_created',
      timestamp: projectRecord.created_at,
      projectName: projectRecord.name,
    })
  }

  // Only show updated if it genuinely differs from created (>1 second gap)
  if (
    projectRecord.updated_at &&
    projectRecord.created_at &&
    projectRecord.updated_at !== projectRecord.created_at
  ) {
    const createdMs = new Date(projectRecord.created_at).getTime()
    const updatedMs = new Date(projectRecord.updated_at).getTime()
    if (Number.isFinite(updatedMs) && updatedMs - createdMs > 1000) {
      events.push({
        kind: 'project_updated',
        timestamp: projectRecord.updated_at,
        projectName: projectRecord.name,
      })
    }
  }

  // ── Entry events — timestamp = entry_date (accounting date only) ──
  for (const entry of entryRecords) {
    const dateKey = extractDateKey(entry.entry_date)
    if (!isValidDateKey(dateKey)) continue
    events.push({
      kind: 'entry_added',
      // Use entry_date as timestamp for grouping — no time fabricated
      timestamp: dateKey,
      entryDate: dateKey,
      entryType: entry.entry_type,
      seq: entry.entry_number,
      amount: Number(entry.amount) || 0,
      description: entry.description?.trim() ?? '',
    })
  }

  // ── Attachment events ──
  for (const att of attachmentRecords) {
    if (!att.created_at) continue
    events.push({
      kind: 'attachment_uploaded',
      timestamp: att.created_at,
      attachmentId: att.id,
      fileName: att.file_name,
      entryId: att.entry_id,
      storagePath: att.storage_path,
    })
  }

  // Sort newest-first; equal timestamps keep original insertion order (stable sort)
  return [...events].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

/**
 * Applies a filter to a list of events.
 * Returns a new array — does not mutate input.
 */
export function applyActivityFilter(events: ActivityEvent[], filter: ActivityFilter): ActivityEvent[] {
  if (filter === 'all') return events
  if (filter === 'entries') return events.filter((e) => e.kind === 'entry_added')
  if (filter === 'attachments') return events.filter((e) => e.kind === 'attachment_uploaded')
  if (filter === 'project')
    return events.filter((e) => e.kind === 'project_created' || e.kind === 'project_updated')
  return events
}

/**
 * Groups a sorted (newest-first) list of events by calendar date.
 * Returns groups newest-first.
 */
export function groupActivityEvents(events: ActivityEvent[], todayKey: string): ActivityGroup[] {
  const groupMap = new Map<string, ActivityEvent[]>()

  for (const event of events) {
    const key = extractDateKey(event.timestamp)
    if (!key || key.length < 10) continue
    const existing = groupMap.get(key)
    if (existing) {
      existing.push(event)
    } else {
      groupMap.set(key, [event])
    }
  }

  return Array.from(groupMap.entries()).map(([dateKey, groupEvents]) => ({
    label: buildGroupLabel(dateKey, todayKey),
    dateKey,
    events: groupEvents,
  }))
}

/**
 * Builds the full ProjectActivityViewModel from raw source data.
 * All logic lives here — component is display-only.
 */
export function buildActivityViewModel(
  projectRecord: { name: string; created_at: string; updated_at: string },
  entryRecords: Parameters<typeof buildActivityEvents>[1],
  attachmentRecords: Parameters<typeof buildActivityEvents>[2],
  filter: ActivityFilter,
  todayKey: string,
): ProjectActivityViewModel {
  const allEvents = buildActivityEvents(projectRecord, entryRecords, attachmentRecords)
  const filtered = applyActivityFilter(allEvents, filter)
  const groups = groupActivityEvents(filtered, todayKey)

  return {
    groups,
    totalCount: filtered.length,
    hasActivity: allEvents.length > 0,
  }
}

// ─── Public async API ─────────────────────────────────────────────────────────

export async function getProjectActivityData(projectId: string): Promise<{
  projectRecord: { name: string; created_at: string; updated_at: string } | null
  entryRecords: Parameters<typeof buildActivityEvents>[1]
  attachmentRecords: Parameters<typeof buildActivityEvents>[2]
}> {
  const [project, entries, attachments] = await Promise.all([
    findActivityProject(projectId),
    findActivityEntries(projectId),
    findActivityAttachments(projectId),
  ])

  return {
    projectRecord: project
      ? { name: project.name, created_at: project.created_at, updated_at: project.updated_at }
      : null,
    entryRecords: entries,
    attachmentRecords: attachments,
  }
}

/** On-demand signed URL — 60 s expiry. */
export async function getActivityAttachmentSignedUrl(storagePath: string): Promise<string> {
  return getActivityAttachmentUrl(storagePath)
}
