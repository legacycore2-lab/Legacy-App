import { FolderArchive, LoaderCircle, X } from 'lucide-react'
import { useDialogAccessibility } from '../../../shared/hooks/useDialogAccessibility'

type Props = {
  open: boolean
  projectName: string
  isArchiving: boolean
  error: string
  onClose: () => void
  onConfirm: () => void
}

export function ProjectArchiveDialog({ open, projectName, isArchiving, error, onClose, onConfirm }: Props) {
  const dialogRef = useDialogAccessibility<HTMLElement>(open, onClose, !isArchiving)
  if (!open) return null

  return (
    <div className="project-create-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="project-create-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-archive-title"
      >
        <header>
          <div>
            <span>إجراء قابل للمراجعة</span>
            <h2 id="project-archive-title">أرشفة المشروع</h2>
            <p>
              سيُخفى «{projectName}» من المشاريع النشطة، مع الاحتفاظ بجميع القيود والمرفقات والسجل المالي.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" disabled={isArchiving}>
            <X size={18} />
          </button>
        </header>
        {error && (
          <div className="project-create-errors" role="alert">
            <p>{error}</p>
          </div>
        )}
        <footer>
          <button
            type="button"
            className="projects-secondary-action"
            onClick={onClose}
            disabled={isArchiving}
          >
            إلغاء
          </button>
          <button
            type="button"
            className="projects-primary-action"
            onClick={onConfirm}
            disabled={isArchiving}
          >
            {isArchiving ? (
              <LoaderCircle className="project-create-spinner" size={17} />
            ) : (
              <FolderArchive size={17} />
            )}
            {isArchiving ? 'جارٍ الأرشفة...' : 'أرشفة المشروع'}
          </button>
        </footer>
      </section>
    </div>
  )
}
