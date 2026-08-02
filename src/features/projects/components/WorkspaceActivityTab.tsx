import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ExternalLink,
  FileText,
  FolderOpen,
  Loader2,
  Paperclip,
  ShieldOff,
} from 'lucide-react'
import { useActivityAttachmentUrl, useProjectActivity } from '../hooks/useProjectActivity'
import type { ActivityEvent, ActivityFilter } from '../types/project-activity.types'

type Props = { projectId: string }

const money = new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('ar-EG', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

const timeFormatter = new Intl.DateTimeFormat('ar-EG', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

/** Formats a full ISO timestamp to a time string — only for events with real created_at. */
function formatTime(isoTimestamp: string): string {
  // A plain YYYY-MM-DD (entry_date) has no time — don't fabricate one
  if (isoTimestamp.length === 10) return ''
  const d = new Date(isoTimestamp)
  return Number.isNaN(d.getTime()) ? '' : timeFormatter.format(d)
}

/** Formats an accounting date (YYYY-MM-DD) — no time shown. */
function formatAccountingDate(dateKey: string): string {
  const parts = dateKey.split('-').map(Number)
  const year = parts[0] ?? 0
  const month = parts[1] ?? 1
  const day = parts[2] ?? 1
  if (!year) return dateKey
  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)))
}

const FILTER_LABELS: Record<ActivityFilter, string> = {
  all: 'الكل',
  entries: 'القيود',
  attachments: 'المرفقات',
  project: 'المشروع',
}

// ─── Single event card ────────────────────────────────────────────────────────

function AttachmentEventCard({ event }: { event: Extract<ActivityEvent, { kind: 'attachment_uploaded' }> }) {
  const { getUrl, isLoading } = useActivityAttachmentUrl()
  const [openError, setOpenError] = useState('')

  async function handleOpen() {
    setOpenError('')
    try {
      const url = await getUrl(event.storagePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setOpenError(err instanceof Error ? err.message : 'تعذر فتح الملف.')
    }
  }

  return (
    <div className="activity-event activity-event--attachment">
      <span className="activity-event__icon">
        <Paperclip size={15} />
      </span>
      <div className="activity-event__body">
        <p>
          رُفع مرفق: <strong>{event.fileName}</strong>
        </p>
        {formatTime(event.timestamp) && (
          <time className="activity-event__time" dateTime={event.timestamp}>
            <Clock size={11} /> {formatTime(event.timestamp)}
          </time>
        )}
        {openError && <span className="activity-event__error">{openError}</span>}
        <button
          type="button"
          className="activity-event__link"
          onClick={() => void handleOpen()}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 size={12} className="spin" /> : <ExternalLink size={12} />}
          فتح الملف
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'

function EventCard({ event }: { event: ActivityEvent }) {
  if (event.kind === 'project_created') {
    return (
      <div className="activity-event activity-event--project">
        <span className="activity-event__icon">
          <FolderOpen size={15} />
        </span>
        <div className="activity-event__body">
          <p>
            أُنشئ المشروع: <strong>{event.projectName}</strong>
          </p>
          {formatTime(event.timestamp) && (
            <time className="activity-event__time" dateTime={event.timestamp}>
              <Clock size={11} /> {formatTime(event.timestamp)}
            </time>
          )}
        </div>
      </div>
    )
  }

  if (event.kind === 'project_updated') {
    return (
      <div className="activity-event activity-event--project">
        <span className="activity-event__icon">
          <FolderOpen size={15} />
        </span>
        <div className="activity-event__body">
          <p>
            تم تحديث بيانات المشروع: <strong>{event.projectName}</strong>
          </p>
          {formatTime(event.timestamp) && (
            <time className="activity-event__time" dateTime={event.timestamp}>
              <Clock size={11} /> {formatTime(event.timestamp)}
            </time>
          )}
        </div>
      </div>
    )
  }

  if (event.kind === 'entry_added') {
    const isIncome = event.entryType === 'income'
    return (
      <div className={`activity-event activity-event--entry activity-event--${event.entryType}`}>
        <span className="activity-event__icon">
          {isIncome ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
        </span>
        <div className="activity-event__body">
          <p>
            {isIncome ? 'إيراد' : 'مصروف'}
            {event.seq != null && <> رقم #{event.seq}</>}: <strong>{money.format(event.amount)}</strong>
            {event.description && <> — {event.description}</>}
          </p>
          {/* Show only the accounting date — never fabricate a time for entries */}
          <span className="activity-event__accounting-date">
            <FileText size={11} /> تاريخ القيد المحاسبي: {formatAccountingDate(event.entryDate)}
          </span>
        </div>
      </div>
    )
  }

  if (event.kind === 'attachment_uploaded') {
    return <AttachmentEventCard event={event} />
  }

  return null
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function WorkspaceActivityTab({ projectId }: Props) {
  const { viewModel, filter, setFilter, isLoading, error } = useProjectActivity(projectId)

  if (error && (error.includes('permission') || error.includes('RLS') || error.includes('policy'))) {
    return (
      <div className="workspace-activity__permission">
        <ShieldOff size={36} />
        <strong>غير مصرح بعرض سجل النشاط</strong>
        <span>تحتاج صلاحية محاسب أو أعلى للوصول إلى هذا القسم.</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="workspace-activity__error" role="alert">
        {error}
      </div>
    )
  }

  return (
    <div className="workspace-activity">
      {/* ── Header + filters ── */}
      <div className="workspace-activity__header">
        <div>
          <span>سجل التغييرات</span>
          <h2>النشاط</h2>
        </div>
        <div className="workspace-activity__filters" role="group" aria-label="فلترة النشاط">
          {(Object.keys(FILTER_LABELS) as ActivityFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`workspace-activity__filter-btn${filter === f ? ' is-active' : ''}`}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="workspace-activity__loading">
          <Loader2 size={24} className="spin" />
          <span>جارٍ تحميل سجل النشاط…</span>
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && viewModel && !viewModel.hasActivity && (
        <div className="workspace-activity__empty">
          <Clock size={34} />
          <strong>لا يوجد نشاط بعد</strong>
          <span>ستظهر هنا أحداث المشروع والقيود والمرفقات تلقائياً.</span>
        </div>
      )}

      {/* ── Filtered empty ── */}
      {!isLoading && viewModel?.hasActivity && viewModel.groups.length === 0 && (
        <div className="workspace-activity__empty">
          <Clock size={34} />
          <strong>لا توجد نتائج لهذا الفلتر</strong>
        </div>
      )}

      {/* ── Timeline ── */}
      {!isLoading && viewModel && viewModel.groups.length > 0 && (
        <div className="workspace-activity__timeline">
          {viewModel.groups.map((group) => (
            <section key={group.dateKey} className="activity-group">
              <h3 className="activity-group__label">{group.label}</h3>
              <div className="activity-group__events">
                {group.events.map((event, idx) => (
                  <EventCard key={`${event.kind}-${event.timestamp}-${idx}`} event={event} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
