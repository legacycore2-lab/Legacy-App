import { useState } from 'react'
import { confirmNegativeBalance } from '../../../shared/finance/negative-balance-warning'
import type {
  Advance,
  AdvanceOptions,
  CreateAdvanceInput,
  RecordAdvanceExpenseInput,
  ReturnAdvanceInput,
} from '../types/advances.types'

const today = () => new Date().toISOString().slice(0, 10)
type CommonProps = {
  options?: AdvanceOptions
  saving: boolean
  error: string
  optionsError?: string
  optionsLoading?: boolean
  onClose: () => void
}

export function CreateAdvanceDialog({
  options,
  saving,
  error,
  optionsError = '',
  optionsLoading = false,
  onClose,
  onSave,
}: CommonProps & { onSave: (input: CreateAdvanceInput) => Promise<unknown> }) {
  const [input, setInput] = useState<CreateAdvanceInput>({
    holderName: '',
    holderTitle: '',
    projectIds: [],
    sourceAccountId: '',
    issueDate: today(),
    dueDate: '',
    purpose: '',
    amount: '',
  })
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const sourceAccount = options?.cashAccounts.find((account) => account.id === input.sourceAccountId)
    const amount = Number(input.amount)
    if (
      sourceAccount &&
      !confirmNegativeBalance({
        accountName: sourceAccount.name,
        currentBalance: sourceAccount.balance ?? 0,
        amount,
      })
    ) {
      return
    }
    await onSave(input)
    onClose()
  }
  const formUnavailable = saving || optionsLoading || Boolean(optionsError) || !options

  return (
    <div className="advance-dialog-backdrop">
      <form className="advance-dialog" onSubmit={submit}>
        <h2>صرف عهدة جديدة</h2>
        <div className="advance-form-grid">
          <label>
            اسم حامل العهدة
            <input
              required
              value={input.holderName}
              onChange={(e) => setInput({ ...input, holderName: e.target.value })}
            />
          </label>
          <label>
            المسمى الوظيفي
            <input
              value={input.holderTitle}
              onChange={(e) => setInput({ ...input, holderTitle: e.target.value })}
            />
          </label>
          <fieldset>
            <legend>المشاريع المرتبطة</legend>
            <div className="advance-project-choices">
              {options?.projects.map((project) => (
                <label key={project.id}>
                  <input
                    type="checkbox"
                    checked={input.projectIds.includes(project.id)}
                    onChange={(e) =>
                      setInput({
                        ...input,
                        projectIds: e.target.checked
                          ? [...input.projectIds, project.id]
                          : input.projectIds.filter((id) => id !== project.id),
                      })
                    }
                  />
                  {project.name}
                </label>
              ))}
            </div>
          </fieldset>
          <label>
            مصدر الصرف
            <select
              required
              value={input.sourceAccountId}
              onChange={(e) => setInput({ ...input, sourceAccountId: e.target.value })}
            >
              <option value="">اختر الخزينة أو البنك</option>
              {options?.cashAccounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {(item.balance ?? 0).toLocaleString('ar-EG')} ج.م
                </option>
              ))}
            </select>
          </label>
          <label>
            تاريخ الصرف
            <input
              required
              type="date"
              value={input.issueDate}
              onChange={(e) => setInput({ ...input, issueDate: e.target.value })}
            />
          </label>
          <label>
            تاريخ الاستحقاق
            <input
              type="date"
              value={input.dueDate}
              onChange={(e) => setInput({ ...input, dueDate: e.target.value })}
            />
          </label>
          <label>
            المبلغ بالجنيه المصري
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={input.amount}
              onChange={(e) => setInput({ ...input, amount: e.target.value })}
            />
          </label>
          <label className="advance-form-wide">
            الغرض
            <textarea
              required
              value={input.purpose}
              onChange={(e) => setInput({ ...input, purpose: e.target.value })}
            />
          </label>
        </div>
        {optionsLoading && <p className="muted">جاري تحميل المشاريع والحسابات...</p>}
        {optionsError && <p className="advances-error">{optionsError}</p>}
        {error && <p className="advances-error">{error}</p>}
        <div className="advance-dialog-actions">
          <button className="advance-primary" disabled={formUnavailable}>
            {saving ? 'جاري الحفظ...' : optionsLoading ? 'جاري التحميل...' : 'صرف العهدة'}
          </button>
          <button type="button" className="advance-secondary" onClick={onClose} disabled={saving}>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}

export function AdvanceMovementDialog({
  mode,
  advance,
  options,
  saving,
  error,
  optionsError = '',
  optionsLoading = false,
  onClose,
  onExpense,
  onReturn,
}: CommonProps & {
  mode: 'expense' | 'return'
  advance: Advance
  onExpense: (input: RecordAdvanceExpenseInput) => Promise<unknown>
  onReturn: (input: ReturnAdvanceInput) => Promise<unknown>
}) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [transactionDate, setDate] = useState(today())
  const [projectId, setProject] = useState('')
  const [accountId, setAccount] = useState('')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'expense')
      await onExpense({
        advanceId: advance.id,
        projectId,
        expenseAccountId: accountId,
        transactionDate,
        description,
        amount,
      })
    else
      await onReturn({
        advanceId: advance.id,
        destinationAccountId: accountId,
        transactionDate,
        description,
        amount,
      })
    onClose()
  }
  const formUnavailable = saving || optionsLoading || Boolean(optionsError) || !options

  return (
    <div className="advance-dialog-backdrop">
      <form className="advance-dialog advance-dialog--small" onSubmit={submit}>
        <h2>{mode === 'expense' ? 'تسجيل مصروف' : 'رد المبلغ المتبقي'}</h2>
        <p>المتاح: {new Intl.NumberFormat('ar-EG').format(advance.remaining)} ج.م</p>
        <div className="advance-form-grid">
          {mode === 'expense' && (
            <label>
              المشروع
              <select required value={projectId} onChange={(e) => setProject(e.target.value)}>
                <option value="">اختر المشروع</option>
                {options?.projects
                  .filter((p) => advance.projectNames.includes(p.name))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <label>
            {mode === 'expense' ? 'حساب المصروف' : 'الخزينة أو البنك'}
            <select required value={accountId} onChange={(e) => setAccount(e.target.value)}>
              <option value="">اختر الحساب</option>
              {(mode === 'expense' ? options?.expenseAccounts : options?.cashAccounts)?.map((item) => (
                <option key={item.id} value={item.id}>
                  {'code' in item ? `${item.code} - ` : ''}
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            التاريخ
            <input required type="date" value={transactionDate} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            المبلغ بالجنيه المصري
            <input
              required
              type="number"
              min="0.01"
              max={advance.remaining}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="advance-form-wide">
            البيان
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </div>
        {optionsLoading && <p className="muted">جاري تحميل الحسابات...</p>}
        {optionsError && <p className="advances-error">{optionsError}</p>}
        {error && <p className="advances-error">{error}</p>}
        <div className="advance-dialog-actions">
          <button className="advance-primary" disabled={formUnavailable}>
            {saving ? 'جاري الحفظ...' : optionsLoading ? 'جاري التحميل...' : 'حفظ وترحيل'}
          </button>
          <button type="button" className="advance-secondary" onClick={onClose} disabled={saving}>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  )
}
