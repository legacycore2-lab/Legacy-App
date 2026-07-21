import { Eye, Save, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { buildJournalPreview, validateSingleLineEntry } from '../services/journal-entry.service'
import type { SingleLineJournalInput } from '../types/journal-entry.types'

const initialValue: SingleLineJournalInput = {
  entryDate: new Date().toISOString().slice(0, 10),
  projectName: '',
  type: 'expense',
  category: '',
  description: '',
  contractor: '',
  paymentAccount: '',
  amount: '',
}

type Props = {
  onClose: () => void
}

export function SingleLineJournalForm({ onClose }: Props) {
  const [value, setValue] = useState(initialValue)
  const [submitted, setSubmitted] = useState(false)
  const errors = useMemo(() => validateSingleLineEntry(value), [value])
  const preview = useMemo(() => buildJournalPreview(value), [value])

  const update = <K extends keyof SingleLineJournalInput>(
    key: K,
    nextValue: SingleLineJournalInput[K],
  ) => setValue((current) => ({ ...current, [key]: nextValue }))

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <section className="journal-entry-card" aria-label="إضافة قيد بسطر واحد">
      <header>
        <div>
          <span>إدخال سريع</span>
          <h2>إضافة قيد بسطر واحد</h2>
          <p>أدخل العملية مرة واحدة، وسيُنشئ المحرك طرفي القيد تلقائيًا.</p>
        </div>
        <button
          type="button"
          className="journal-icon-button"
          onClick={onClose}
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="journal-entry-grid">
          <label>
            التاريخ
            <input
              type="date"
              value={value.entryDate}
              onChange={(event) => update('entryDate', event.target.value)}
            />
          </label>
          <label>
            النوع
            <select
              value={value.type}
              onChange={(event) =>
                update('type', event.target.value as SingleLineJournalInput['type'])
              }
            >
              <option value="expense">مصروف</option>
              <option value="income">إيراد</option>
            </select>
          </label>
          <label>
            المشروع
            <input
              value={value.projectName}
              onChange={(event) => update('projectName', event.target.value)}
              placeholder="اختر أو اكتب المشروع"
            />
          </label>
          <label>
            البند
            <input
              value={value.category}
              onChange={(event) => update('category', event.target.value)}
              placeholder="مثال: خرسانة"
            />
          </label>
          <label>
            الحساب المقابل
            <input
              value={value.paymentAccount}
              onChange={(event) => update('paymentAccount', event.target.value)}
              placeholder="الخزنة، البنك، عهدة..."
            />
          </label>
          <label>
            المبلغ
            <input
              inputMode="decimal"
              value={value.amount}
              onChange={(event) => update('amount', event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label className="journal-entry-wide">
            البيان
            <input
              value={value.description}
              onChange={(event) => update('description', event.target.value)}
              placeholder="وصف العملية"
            />
          </label>
          <label>
            المقاول / الطرف
            <input
              value={value.contractor}
              onChange={(event) => update('contractor', event.target.value)}
              placeholder="اختياري"
            />
          </label>
        </div>

        {submitted && errors.length > 0 && (
          <div className="journal-entry-errors">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        {preview && (
          <div className="journal-entry-preview">
            <div>
              <Eye size={17} />
              <strong>المعاينة المحاسبية التلقائية</strong>
            </div>
            <p>
              <span>مدين</span> {preview.debitAccount} —{' '}
              {preview.amount.toLocaleString('ar-EG')} ج.م
            </p>
            <p>
              <span>دائن</span> {preview.creditAccount} —{' '}
              {preview.amount.toLocaleString('ar-EG')} ج.م
            </p>
          </div>
        )}

        <footer>
          <button type="button" className="journal-secondary" onClick={onClose}>
            إلغاء
          </button>
          <button
            type="submit"
            className="journal-primary"
            title="الحفظ الفعلي سيُربط بقاعدة البيانات في المرحلة التالية"
          >
            <Save size={17} /> مراجعة القيد
          </button>
        </footer>
      </form>
    </section>
  )
}
