import { LoaderCircle, Save, Trash2, X } from 'lucide-react'
import { useDialogAccessibility } from '../../../shared/hooks/useDialogAccessibility'
import type { CashBankAccountFormState } from '../types/cash-banks.types'

export function CashBankAccountDialog({ form }: { form: CashBankAccountFormState }) {
  const dialogRef = useDialogAccessibility<HTMLElement>(form.isOpen, form.close, !form.isSaving)

  if (!form.isOpen) return null

  return (
    <div className="cash-bank-dialog-backdrop" role="presentation">
      <section
        ref={dialogRef}
        className="cash-bank-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cash-bank-dialog-title"
      >
        <header>
          <div>
            <span>إدارة الحسابات</span>
            <h2 id="cash-bank-dialog-title">{form.isEditing ? 'تعديل الحساب' : 'حساب جديد'}</h2>
            <p>اربط الخزنة أو البنك بحساب أستاذ صالح واحفظ بياناته التشغيلية.</p>
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
              الاسم
              <input value={form.value.name} onChange={(e) => form.update('name', e.target.value)} />
            </label>
            <label>
              النوع
              <select
                value={form.value.kind}
                onChange={(e) => form.update('kind', e.target.value as 'cash' | 'bank')}
              >
                <option value="cash">خزنة</option>
                <option value="bank">بنك</option>
              </select>
            </label>
            {!form.isEditing && (
              <fieldset className="cash-bank-dialog-wide cash-bank-ledger-mode">
                <legend>حساب الأستاذ</legend>
                <label>
                  <input
                    type="radio"
                    name="ledger-mode"
                    checked={form.value.ledgerMode === 'auto'}
                    onChange={() => form.update('ledgerMode', 'auto')}
                  />
                  إنشاء حساب أستاذ تلقائيًا
                </label>
                <label>
                  <input
                    type="radio"
                    name="ledger-mode"
                    checked={form.value.ledgerMode === 'existing'}
                    onChange={() => form.update('ledgerMode', 'existing')}
                  />
                  ربط حساب موجود
                </label>
                {form.value.ledgerMode === 'auto' && (
                  <small>سيُنشأ حساب ترحيل تلقائيًا تحت 1100 — النقدية والبنوك.</small>
                )}
              </fieldset>
            )}
            {(form.isEditing || form.value.ledgerMode === 'existing') && (
              <label className="cash-bank-dialog-wide">
                حساب الأستاذ
                <select
                  value={form.value.ledgerAccountId}
                  onChange={(e) => form.update('ledgerAccountId', e.target.value)}
                  disabled={form.isEditing || form.isLoading}
                >
                  <option value="">اختر حسابًا</option>
                  {form.ledgerAccounts.map((account) => (
                    <option value={account.id} key={account.id}>
                      {account.code} — {account.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {form.value.kind === 'bank' && (
              <>
                <label>
                  اسم البنك
                  <input
                    value={form.value.bankName}
                    onChange={(e) => form.update('bankName', e.target.value)}
                  />
                </label>
                <label>
                  رقم الحساب
                  <input
                    value={form.value.accountNumber}
                    onChange={(e) => form.update('accountNumber', e.target.value)}
                  />
                </label>
                <label>
                  IBAN
                  <input
                    dir="ltr"
                    value={form.value.iban}
                    onChange={(e) => form.update('iban', e.target.value)}
                  />
                </label>
                <label>
                  الفرع
                  <input
                    value={form.value.branchName}
                    onChange={(e) => form.update('branchName', e.target.value)}
                  />
                </label>
              </>
            )}
            <label>
              الرصيد الافتتاحي
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value.openingBalance}
                onChange={(e) => form.update('openingBalance', e.target.value)}
                disabled={form.isEditing || form.isLoading}
              />
            </label>
            <label>
              العملة
              <input value="EGP — جنيه مصري" disabled />
            </label>
            <label className="cash-bank-dialog-check">
              <input
                type="checkbox"
                checked={form.value.isActive}
                onChange={(e) => form.update('isActive', e.target.checked)}
              />
              الحساب نشط
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
            {form.isEditing && form.value.isActive && (
              <button type="button" className="cash-bank-danger" onClick={() => void form.deactivate()}>
                <Trash2 size={17} />
                إلغاء تفعيل الحساب
              </button>
            )}
            <span />
            <button type="button" className="cash-bank-secondary" onClick={form.close}>
              إلغاء
            </button>
            <button type="submit" className="cash-banks-primary" disabled={form.isSaving || form.isLoading}>
              {form.isSaving ? <LoaderCircle className="cash-bank-spinner" size={17} /> : <Save size={17} />}
              {form.isSaving ? 'جارٍ الحفظ...' : 'حفظ الحساب'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
