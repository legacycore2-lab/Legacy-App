import { LoaderCircle, Trash2, X } from 'lucide-react'

type ProjectDeleteDialogProps = {
  open: boolean
  projectName: string
  confirmation: string
  onConfirmationChange: (value: string) => void
  canDelete: boolean
  isDeleting: boolean
  error: string
  onClose: () => void
  onConfirm: () => void
}

export function ProjectDeleteDialog({
  open,
  projectName,
  confirmation,
  onConfirmationChange,
  canDelete,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: ProjectDeleteDialogProps) {
  if (!open) return null

  return (
    <div className="project-create-backdrop" role="presentation">
      <section
        className="project-create-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-delete-title"
      >
        <header>
          <div>
            <span>إجراء نهائي</span>
            <h2 id="project-delete-title">حذف المشروع</h2>
            <p>لن يُحذف المشروع إذا كان مرتبطًا بقيود أو حركات مالية. اكتب اسم المشروع للتأكيد.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" disabled={isDeleting}>
            <X size={18} />
          </button>
        </header>

        <div className="project-create-grid">
          <label className="project-create-wide">
            اكتب: {projectName}
            <input
              value={confirmation}
              onChange={(event) => onConfirmationChange(event.target.value)}
              disabled={isDeleting}
              autoComplete="off"
              autoFocus
            />
          </label>
        </div>

        {error && (
          <div className="project-create-errors" role="alert">
            <p>{error}</p>
          </div>
        )}

        <footer>
          <button type="button" className="projects-secondary-action" onClick={onClose} disabled={isDeleting}>
            إلغاء
          </button>
          <button type="button" className="projects-primary-action" onClick={onConfirm} disabled={!canDelete}>
            {isDeleting ? (
              <LoaderCircle className="project-create-spinner" size={17} />
            ) : (
              <Trash2 size={17} />
            )}
            {isDeleting ? 'جارٍ الحذف...' : 'حذف نهائي'}
          </button>
        </footer>
      </section>
    </div>
  )
}
