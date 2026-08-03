import { ArrowUpFromLine, LoaderCircle, X } from 'lucide-react'
import { useDialogAccessibility } from '../../../shared/hooks/useDialogAccessibility'
import type { CashBankWithdrawalFormState } from '../types/cash-banks.types'

export function CashBankWithdrawalDialog({ form }: { form: CashBankWithdrawalFormState }) {
  const dialogRef = useDialogAccessibility<HTMLElement>(form.isOpen, form.close, !form.isSaving)

  if (!form.isOpen) return null

  return (
    <div className="cash-bank-dialog-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="cash-bank-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdrawal-title"
      >
        <header>
          <div>
            <span>حركة مالية</span>
            <h2 id="withdrawal-title">تسجيل سحب</h2>
            <p>سيُنشأ قيد يومية متوازن ويُرحّل مع حركة السحب في عملية ذرية واحدة.</p>
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
              حساب الخزنة أو البنك
              <select
                value={form.value.sourceAccountId}
                onChange={(event) => form.update('sourceAccountId', event.target.value)}
              >
                <option value="">اختر الحساب</option>
                {form.sourceAccounts.map((account) => (
                  <option value={account.id} key={account.id}>
                    {account.name} — {account.currentBalance.toLocaleString('ar-EG')} ج.م
                  </option>
                ))}
              </select>
            </label>
            <label>
              الحساب المقابل
              <select
                value={form.value.offsetAccountId}
                onChange={(event) => form.update('offsetAccountId', event.target.value)}
              >
                <option value="">اختر الحساب المقابل</option>
                {form.offsetAccounts.map((account) => (
                  <option value={account.id} key={account.id}>
                    {account.code} — {account.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              التاريخ
              <input
                type="date"
                value={form.value.transactionDate}
                onChange={(event) => form.update('transactionDate', event.target.value)}
              />
            </label>
            <label>
              المبلغ (ج.م)
              <input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={form.value.amount}
                onChange={(event) => form.update('amount', event.target.value)}
              />
            </label>
            <label className="cash-bank-dialog-wide">
              الوصف
              <textarea
                value={form.value.description}
                onChange={(event) => form.update('description', event.target.value)}
              />
            </label>
            <label className="cash-bank-dialog-wide">
              رقم المرجع
              <input
                value={form.value.referenceNumber}
                onChange={(event) => form.update('referenceNumber', event.target.value)}
                placeholder="اختياري"
              />
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
                <ArrowUpFromLine size={17} />
              )}
              {form.isSaving ? 'جارٍ الترحيل...' : 'ترحيل السحب'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
