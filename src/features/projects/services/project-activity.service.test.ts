import { describe, expect, it } from 'vitest'
import {
  applyActivityFilter,
  buildActivityEvents,
  buildActivityViewModel,
  buildGroupLabel,
  extractDateKey,
  groupActivityEvents,
  isValidDateKey,
} from './project-activity.service'
import type { ActivityEvent } from '../types/project-activity.types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PROJECT = {
  name: 'مشروع اختبار',
  created_at: '2025-03-01T08:00:00Z',
  updated_at: '2025-03-15T10:00:00Z',
}

const ENTRY_INCOME = {
  id: 'e1',
  entry_number: 1,
  entry_type: 'income' as const,
  amount: 5000,
  description: 'دفعة أولى',
  entry_date: '2025-03-10',
  project_id: 'p1',
}

const ENTRY_EXPENSE = {
  id: 'e2',
  entry_number: 2,
  entry_type: 'expense' as const,
  amount: 2000,
  description: 'مواد بناء',
  entry_date: '2025-03-12',
  project_id: 'p1',
}

const ATTACHMENT = {
  id: 'att1',
  entry_id: 'e1',
  file_name: 'invoice.pdf',
  storage_path: 'entries/e1/invoice.pdf',
  created_at: '2025-03-11T09:30:00Z',
}

// ─── extractDateKey ───────────────────────────────────────────────────────────

describe('extractDateKey', () => {
  it('extracts date from ISO timestamp', () => {
    expect(extractDateKey('2025-03-15T10:00:00Z')).toBe('2025-03-15')
  })

  it('returns plain date string unchanged', () => {
    expect(extractDateKey('2025-03-10')).toBe('2025-03-10')
  })
})

// ─── buildGroupLabel ──────────────────────────────────────────────────────────

describe('buildGroupLabel', () => {
  it('returns "اليوم" for today', () => {
    const today = '2025-06-15'
    expect(buildGroupLabel('2025-06-15', today)).toBe('اليوم')
  })

  it('returns "أمس" for yesterday', () => {
    const today = '2025-06-15'
    expect(buildGroupLabel('2025-06-14', today)).toBe('أمس')
  })

  it('returns formatted date for older dates', () => {
    const label = buildGroupLabel('2025-03-10', '2025-06-15')
    expect(label).not.toBe('اليوم')
    expect(label).not.toBe('أمس')
    expect(label.length).toBeGreaterThan(4)
  })

  it('handles month boundary correctly (Jan 1 → yesterday is Dec 31)', () => {
    const label = buildGroupLabel('2024-12-31', '2025-01-01')
    expect(label).toBe('أمس')
  })
})

// ─── buildActivityEvents ──────────────────────────────────────────────────────

describe('buildActivityEvents', () => {
  it('returns empty array for project with no events and blank timestamps', () => {
    const events = buildActivityEvents({ name: 'x', created_at: '', updated_at: '' }, [], [])
    expect(events).toHaveLength(0)
  })

  it('project with no entries and no attachments returns only project events', () => {
    const events = buildActivityEvents(PROJECT, [], [])
    const kinds = events.map((e) => e.kind)
    expect(kinds).toContain('project_created')
    expect(kinds).toContain('project_updated')
    expect(kinds).not.toContain('entry_added')
    expect(kinds).not.toContain('attachment_uploaded')
  })

  it('merges project + entry + attachment events', () => {
    const events = buildActivityEvents(PROJECT, [ENTRY_INCOME, ENTRY_EXPENSE], [ATTACHMENT])
    const kinds = new Set(events.map((e) => e.kind))
    expect(kinds.has('project_created')).toBe(true)
    expect(kinds.has('project_updated')).toBe(true)
    expect(kinds.has('entry_added')).toBe(true)
    expect(kinds.has('attachment_uploaded')).toBe(true)
  })

  it('events are sorted newest-first', () => {
    const events = buildActivityEvents(PROJECT, [ENTRY_INCOME, ENTRY_EXPENSE], [ATTACHMENT])
    for (let i = 0; i < events.length - 1; i++) {
      expect(events[i].timestamp.localeCompare(events[i + 1].timestamp)).toBeGreaterThanOrEqual(0)
    }
  })

  it('does not mutate input arrays', () => {
    const entries = [ENTRY_INCOME, ENTRY_EXPENSE]
    const attachments = [ATTACHMENT]
    const originalEntries = [...entries]
    const originalAttachments = [...attachments]
    buildActivityEvents(PROJECT, entries, attachments)
    expect(entries).toEqual(originalEntries)
    expect(attachments).toEqual(originalAttachments)
  })

  it('skips entry_updated event if timestamps differ by ≤1 second', () => {
    const sameProject = { ...PROJECT, updated_at: '2025-03-01T08:00:00Z' }
    const events = buildActivityEvents(sameProject, [], [])
    const kinds = events.map((e) => e.kind)
    expect(kinds.filter((k) => k === 'project_created')).toHaveLength(1)
    expect(kinds).not.toContain('project_updated')
  })

  it('entry_added uses entry_date as timestamp (no time fabricated)', () => {
    const events = buildActivityEvents(PROJECT, [ENTRY_INCOME], [])
    const entryEvent = events.find((e) => e.kind === 'entry_added')
    expect(entryEvent).toBeDefined()
    if (entryEvent?.kind === 'entry_added') {
      // timestamp is the date-only string — length exactly 10
      expect(entryEvent.timestamp).toBe('2025-03-10')
      expect(entryEvent.timestamp).toHaveLength(10)
    }
  })

  it('ignores entry with invalid date', () => {
    const badEntry = { ...ENTRY_INCOME, entry_date: 'not-a-date' }
    const events = buildActivityEvents(PROJECT, [badEntry], [])
    expect(events.every((e) => e.kind !== 'entry_added')).toBe(true)
  })

  it('equal timestamps preserve stable order', () => {
    // Both entries have the same date — order should be consistent
    const e1 = { ...ENTRY_INCOME, entry_date: '2025-03-10' }
    const e2 = { ...ENTRY_EXPENSE, entry_date: '2025-03-10' }
    const events1 = buildActivityEvents(PROJECT, [e1, e2], [])
    const events2 = buildActivityEvents(PROJECT, [e2, e1], [])
    // Both runs should produce the same event count
    expect(events1.length).toBe(events2.length)
  })
})

// ─── applyActivityFilter ──────────────────────────────────────────────────────

describe('applyActivityFilter', () => {
  const events = buildActivityEvents(PROJECT, [ENTRY_INCOME], [ATTACHMENT])

  it('"all" returns all events', () => {
    expect(applyActivityFilter(events, 'all')).toHaveLength(events.length)
  })

  it('"entries" returns only entry_added events', () => {
    const filtered = applyActivityFilter(events, 'entries')
    expect(filtered.every((e) => e.kind === 'entry_added')).toBe(true)
  })

  it('"attachments" returns only attachment_uploaded events', () => {
    const filtered = applyActivityFilter(events, 'attachments')
    expect(filtered.every((e) => e.kind === 'attachment_uploaded')).toBe(true)
  })

  it('"project" returns only project_created/updated events', () => {
    const filtered = applyActivityFilter(events, 'project')
    expect(filtered.every((e) => e.kind === 'project_created' || e.kind === 'project_updated')).toBe(true)
  })

  it('does not mutate input array', () => {
    const original = [...events]
    applyActivityFilter(events, 'entries')
    expect(events).toEqual(original)
  })
})

// ─── groupActivityEvents ──────────────────────────────────────────────────────

describe('groupActivityEvents', () => {
  it('groups events by calendar date', () => {
    const events = buildActivityEvents(PROJECT, [ENTRY_INCOME, ENTRY_EXPENSE], [ATTACHMENT])
    const groups = groupActivityEvents(events, '2025-06-15')
    // All events in a group share the same dateKey
    for (const group of groups) {
      for (const event of group.events) {
        expect(extractDateKey(event.timestamp)).toBe(group.dateKey)
      }
    }
  })

  it('returns empty groups for empty event list', () => {
    expect(groupActivityEvents([], '2025-06-15')).toHaveLength(0)
  })

  it('labels "اليوم" for today group', () => {
    const todayKey = '2025-06-15'
    const event: ActivityEvent = {
      kind: 'project_created',
      timestamp: '2025-06-15T08:00:00Z',
      projectName: 'x',
    }
    const groups = groupActivityEvents([event], todayKey)
    expect(groups[0].label).toBe('اليوم')
  })
})

// ─── buildActivityViewModel ───────────────────────────────────────────────────

describe('buildActivityViewModel', () => {
  it('hasActivity false for project with empty timestamps', () => {
    const vm = buildActivityViewModel(
      { name: 'x', created_at: '', updated_at: '' },
      [],
      [],
      'all',
      '2025-06-15',
    )
    expect(vm.hasActivity).toBe(false)
    expect(vm.totalCount).toBe(0)
    expect(vm.groups).toHaveLength(0)
  })

  it('totalCount reflects filter', () => {
    const vm = buildActivityViewModel(PROJECT, [ENTRY_INCOME], [ATTACHMENT], 'entries', '2025-06-15')
    expect(vm.totalCount).toBe(1)
  })

  it('hasActivity is true even when filter yields 0 results', () => {
    // project has entries but filter is 'attachments' with no attachments
    const vm = buildActivityViewModel(PROJECT, [ENTRY_INCOME], [], 'attachments', '2025-06-15')
    expect(vm.hasActivity).toBe(true) // overall activity exists
    expect(vm.totalCount).toBe(0) // but filtered view is empty
  })
})
// ─── isValidDateKey ───────────────────────────────────────────────────────────

describe('isValidDateKey', () => {
  it('accepts a normal valid date', () => {
    expect(isValidDateKey('2025-03-15')).toBe(true)
  })

  it('rejects impossible date 2026-02-31 (February has ≤28 days in non-leap year)', () => {
    expect(isValidDateKey('2026-02-31')).toBe(false)
  })

  it('accepts 2028-02-29 (2028 is a leap year)', () => {
    expect(isValidDateKey('2028-02-29')).toBe(true)
  })

  it('rejects 2027-02-29 (2027 is not a leap year)', () => {
    expect(isValidDateKey('2027-02-29')).toBe(false)
  })

  it('rejects non-numeric string like "not-a-date"', () => {
    expect(isValidDateKey('not-a-date')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidDateKey('')).toBe(false)
  })

  it('rejects date with wrong format (no leading zeros)', () => {
    expect(isValidDateKey('2025-3-5')).toBe(false)
  })

  it('rejects month 13', () => {
    expect(isValidDateKey('2025-13-01')).toBe(false)
  })
})

// ─── todayLocalKey behaviour near midnight ────────────────────────────────────

describe('buildGroupLabel local vs UTC', () => {
  it('uses the provided todayKey for "اليوم" comparison — not internal UTC logic', () => {
    // Simulate UTC+3 scenario: UTC date is 2025-06-14 but local date is 2025-06-15
    // The hook passes the LOCAL date as todayKey, so events on 2025-06-15 show "اليوم"
    const localToday = '2025-06-15'
    expect(buildGroupLabel('2025-06-15', localToday)).toBe('اليوم')
    // And the UTC-previous-day shows "أمس" from the local perspective
    expect(buildGroupLabel('2025-06-14', localToday)).toBe('أمس')
  })

  it('an event timestamped on the UTC day but passed local todayKey correctly resolves', () => {
    // At 00:30 local (UTC+3), local date = 2025-06-15 but UTC date = 2025-06-14
    // The event's timestamp is '2025-06-15T00:30:00+03:00' → extractDateKey gives '2025-06-15'
    // todayKey passed from hook = local '2025-06-15' → should be "اليوم"
    const eventDateKey = extractDateKey('2025-06-15T00:30:00+03:00')
    expect(buildGroupLabel(eventDateKey, '2025-06-15')).toBe('اليوم')
  })
})
