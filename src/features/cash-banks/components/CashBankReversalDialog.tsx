import { LoaderCircle, RotateCcw, X } from 'lucide-react'
import type { CashBankReversalFormState } from '../types/cash-banks.types'

export function CashBankReversalDialog({ form }: { form: CashBankReversalFormState }) {
  if (!form.isOpen || !form.movement) return null

  return (
    <div className="cash-bank-dialog-backdrop" role="presentation">
      <section className="cash-bank-dialog" role="dialog" aria-modal="true" aria-labelledby="reversal-title">
        <header>
          <div>
            <span>سجل المراجعة</span>
            <h2 id="reversal-title">عكس الحركة {form.movement.number}</h2>
            <p>ستظل الحركة الأصلية محفوظة، وسيُنشأ قيد معاكس وحركة مرتبطة بها.</p>
          </div>
          <button type="button" onClick={form.close} aria-label="إغلاق" disabled={form.isSaving}>
            <X size={18} />
          </button>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void form.submit()
          }}
        >
          <div className="cash-bank-dialog-grid">
            <label>
              تاريخ العكس
              <input
                type="date"
                value={form.reversalDate}
                onChange={(event) => form.updateDate(event.target.value)}
              />
            </label>
            <label className="cash-bank-dialog-wide">
              سبب العكس
              <textarea value={form.reason} onChange={(event) => form.updateReason(event.target.value)} />
            </label>
          </div>

          {form.submitted && form.errors.length > 0 && (
            <div className="cash-bank-dialog-errors" role="alert">
              {form.errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}
          {form.saveError && (
            <div className="cash-bank-dialog-errors" role="alert">
              {form.saveError}
            </div>
          )}

          <footer>
            <span />
            <button type="button" className="cash-bank-secondary" onClick={form.close}>
              إلغاء
            </button>
            <button type="submit" className="cash-banks-primary" disabled={form.isSaving}>
              {form.isSaving ? (
                <LoaderCircle className="cash-bank-spinner" size={17} />
              ) : (
                <RotateCcw size={17} />
              )}
              {form.isSaving ? 'جارٍ العكس...' : 'تأكيد العكس'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
