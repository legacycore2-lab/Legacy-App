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
import { useState } from 'react'
import { formatAccountingDate } from '../../../shared/date-utils'
import { formatMoneyInteger } from '../../../shared/formatters'
import { useActivityAttachmentUrl, useProjectActivity } from '../hooks/useProjectActivity'
import type { ActivityEvent, ActivityFilter } from '../types/project-activity.types'

type Props = { projectId: string }

const timeFormatter = new Intl.DateTimeFormat('ar-EG', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

function formatTime(isoTimestamp: string): string {
  if (isoTimestamp.length === 10) return ''
  const date = new Date(isoTimestamp)
  return Number.isNaN(date.getTime()) ? '' : timeFormatter.format(date)
}

const FILTER_LABELS: Record<ActivityFilter, string> = {
  all: 'الكل',
  entries: 'القيود',
  attachments: 'المرفقات',
  project: 'المشروع',
}

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
            آخر تحديث لبيانات المشروع: <strong>{event.projectName}</strong>
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
            {event.seq != null && <> رقم #{event.seq}</>}: <strong>{formatMoneyInteger(event.amount)}</strong>
            {event.description && <> — {event.description}</>}
          </p>
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

export function WorkspaceActivityTab({ projectId }: Props) {
  const { viewModel, filter, setFilter, isLoading, error, isPermissionDenied } =
    useProjectActivity(projectId)

  if (isPermissionDenied) {
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
      <div className="workspace-activity__header">
        <div>
          <span>ملخص نشاط المشروع</span>
          <h2>النشاط</h2>
        </div>
        <div className="workspace-activity__filters" role="group" aria-label="فلترة النشاط">
          {(Object.keys(FILTER_LABELS) as ActivityFilter[]).map((filterValue) => (
            <button
              key={filterValue}
              type="button"
              className={`workspace-activity__filter-btn${filter === filterValue ? ' is-active' : ''}`}
              onClick={() => setFilter(filterValue)}
              aria-pressed={filter === filterValue}
            >
              {FILTER_LABELS[filterValue]}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="workspace-activity__loading">
          <Loader2 size={24} className="spin" />
          <span>جارٍ تحميل سجل النشاط…</span>
        </div>
      )}

      {!isLoading && viewModel && !viewModel.hasActivity && (
        <div className="workspace-activity__empty">
          <Clock size={34} />
          <strong>لا يوجد نشاط بعد</strong>
          <span>ستظهر هنا أحداث المشروع والقيود والمرفقات تلقائياً.</span>
        </div>
      )}

      {!isLoading && viewModel?.hasActivity && viewModel.groups.length === 0 && (
        <div className="workspace-activity__empty">
          <Clock size={34} />
          <strong>لا توجد نتائج لهذا الفلتر</strong>
        </div>
      )}

      {!isLoading && viewModel && viewModel.groups.length > 0 && (
        <div className="workspace-activity__timeline">
          {viewModel.groups.map((group) => (
            <section key={group.dateKey} className="activity-group">
              <h3 className="activity-group__label">{group.label}</h3>
              <div className="activity-group__events">
                {group.events.map((event, index) => (
                  <EventCard key={`${event.kind}-${event.timestamp}-${index}`} event={event} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
