import { useState } from 'react'
import {
  Bell,
  Building2,
  Calculator,
  FileClock,
  FileText,
  Globe2,
  Save,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import type { SettingsTab, SystemSettings } from '../types/settings.types'
import '../styles/settings.css'

const tabs: Array<{ id: SettingsTab; label: string; icon: typeof Building2 }> = [
  { id: 'general', label: 'عام', icon: Building2 },
  { id: 'financial', label: 'المالية والضرائب', icon: Calculator },
  { id: 'documents', label: 'المستندات', icon: FileText },
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'security', label: 'الأمان', icon: ShieldCheck },
  { id: 'audit', label: 'سجل التغييرات', icon: FileClock },
]
const Field = ({
  label,
  children,
  wide = false,
}: {
  label: string
  children: React.ReactNode
  wide?: boolean
}) => (
  <label className={wide ? 'settings-field settings-field--wide' : 'settings-field'}>
    <span>{label}</span>
    {children}
  </label>
)
const Switch = ({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) => (
  <label className="settings-switch">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span>{label}</span>
  </label>
)

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('general')
  const [draft, setDraft] = useState<SystemSettings | null>(null)
  const [saved, setSaved] = useState(false)
  const { settings, audit, isLoading, error, isSaving, save, uploadLogo } = useSettings()
  const form = draft ?? settings
  const change = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setDraft((current) => ({ ...(current ?? settings!), [key]: value }))
    setSaved(false)
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    await save(form)
    setSaved(true)
  }
  return (
    <main className="settings-page">
      <header>
        <span>الإدارة</span>
        <h1>الإعدادات</h1>
        <p>إدارة إعدادات الشركة والنظام.</p>
      </header>
      <nav className="settings-tabs" aria-label="أقسام الإعدادات">
        {tabs.map((item) => {
          const Icon = item.icon
          return (
            <button
              type="button"
              key={item.id}
              className={tab === item.id ? 'is-active' : ''}
              onClick={() => setTab(item.id)}
            >
              <Icon size={18} />
              {item.label}
            </button>
          )
        })}
      </nav>
      {error && (
        <div className="settings-error" role="alert">
          {error}
        </div>
      )}
      {isLoading || !form ? (
        <div className="settings-loading">جاري تحميل الإعدادات...</div>
      ) : (
        <form onSubmit={submit}>
          {tab === 'general' && (
            <div className="settings-general">
              <section className="settings-panel settings-company">
                <h2>
                  <Building2 /> بيانات الشركة
                </h2>
                <div className="settings-grid">
                  <Field label="الاسم القانوني للشركة">
                    <input
                      required
                      value={form.companyLegalName}
                      onChange={(e) => change('companyLegalName', e.target.value)}
                    />
                  </Field>
                  <Field label="الاسم التجاري">
                    <input
                      value={form.companyTradeName}
                      onChange={(e) => change('companyTradeName', e.target.value)}
                    />
                  </Field>
                  <Field label="رقم التسجيل الضريبي">
                    <input
                      inputMode="numeric"
                      value={form.taxRegistrationNumber}
                      onChange={(e) => change('taxRegistrationNumber', e.target.value)}
                    />
                  </Field>
                  <Field label="السجل التجاري">
                    <input
                      inputMode="numeric"
                      value={form.commercialRegistrationNumber}
                      onChange={(e) => change('commercialRegistrationNumber', e.target.value)}
                    />
                  </Field>
                  <Field label="رقم الهاتف">
                    <input
                      dir="ltr"
                      placeholder="+20"
                      value={form.phone}
                      onChange={(e) => change('phone', e.target.value)}
                    />
                  </Field>
                  <Field label="البريد الإلكتروني">
                    <input
                      dir="ltr"
                      type="email"
                      value={form.email}
                      onChange={(e) => change('email', e.target.value)}
                    />
                  </Field>
                  <Field label="العنوان" wide>
                    <textarea value={form.address} onChange={(e) => change('address', e.target.value)} />
                  </Field>
                </div>
              </section>
              <div className="settings-side">
                <section className="settings-panel">
                  <h2>هوية النظام</h2>
                  <div className="settings-logo">
                    {form.logoUrl ? <img src={form.logoUrl} alt="شعار الشركة" /> : <Building2 size={44} />}
                    <span>شعار الشركة</span>
                  </div>
                  <label className="settings-upload">
                    <Upload size={16} /> رفع شعار من الجهاز
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) change('logoUrl', await uploadLogo(file))
                      }}
                    />
                  </label>
                  <Field label="اسم النظام (عربي)">
                    <input
                      value={form.systemNameAr}
                      onChange={(e) => change('systemNameAr', e.target.value)}
                    />
                  </Field>
                  <Field label="اسم النظام (English)">
                    <input
                      dir="ltr"
                      value={form.systemNameEn}
                      onChange={(e) => change('systemNameEn', e.target.value)}
                    />
                  </Field>
                </section>
                <section className="settings-panel">
                  <h2>
                    <Globe2 /> الإعدادات الإقليمية
                  </h2>
                  <dl className="settings-region">
                    <div>
                      <dt>البلد</dt>
                      <dd>مصر</dd>
                    </div>
                    <div>
                      <dt>العملة</dt>
                      <dd>الجنيه المصري (ج.م)</dd>
                    </div>
                    <div>
                      <dt>اللغة</dt>
                      <dd>العربية</dd>
                    </div>
                    <div>
                      <dt>المنطقة الزمنية</dt>
                      <dd>القاهرة (UTC+02:00)</dd>
                    </div>
                  </dl>
                </section>
              </div>
            </div>
          )}
          {tab === 'financial' && (
            <section className="settings-panel settings-tab-panel">
              <h2>
                <Calculator /> الإعدادات المالية والضرائب
              </h2>
              <div className="settings-grid">
                <Field label="بداية السنة المالية">
                  <select
                    value={form.fiscalYearStartMonth}
                    onChange={(e) => change('fiscalYearStartMonth', Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        شهر {i + 1}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="نسبة ضريبة القيمة المضافة">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.vatRate}
                    onChange={(e) => change('vatRate', Number(e.target.value))}
                  />
                </Field>
                <div className="settings-field--wide settings-switches">
                  <Switch
                    label="تفعيل ضريبة القيمة المضافة"
                    checked={form.vatEnabled}
                    onChange={(v) => change('vatEnabled', v)}
                  />
                  <Switch
                    label="الأسعار تشمل الضريبة"
                    checked={form.pricesIncludeVat}
                    onChange={(v) => change('pricesIncludeVat', v)}
                  />
                </div>
              </div>
            </section>
          )}
          {tab === 'documents' && (
            <section className="settings-panel settings-tab-panel">
              <h2>
                <FileText /> ترقيم المستندات
              </h2>
              <div className="settings-numbering">
                <b>المستند</b>
                <b>بادئة الرقم</b>
                <b>الرقم التالي</b>
                <span>القيود اليومية</span>
                <input
                  value={form.journalPrefix}
                  onChange={(e) => change('journalPrefix', e.target.value.toUpperCase())}
                />
                <input
                  type="number"
                  min="1"
                  value={form.nextJournalNumber}
                  onChange={(e) => change('nextJournalNumber', Number(e.target.value))}
                />
                <span>المشاريع</span>
                <input
                  value={form.projectPrefix}
                  onChange={(e) => change('projectPrefix', e.target.value.toUpperCase())}
                />
                <input
                  type="number"
                  min="1"
                  value={form.nextProjectNumber}
                  onChange={(e) => change('nextProjectNumber', Number(e.target.value))}
                />
                <span>العُهد والسلف</span>
                <input
                  value={form.advancePrefix}
                  onChange={(e) => change('advancePrefix', e.target.value.toUpperCase())}
                />
                <input
                  type="number"
                  min="1"
                  value={form.nextAdvanceNumber}
                  onChange={(e) => change('nextAdvanceNumber', Number(e.target.value))}
                />
              </div>
            </section>
          )}
          {tab === 'notifications' && (
            <section className="settings-panel settings-tab-panel">
              <h2>
                <Bell /> الإشعارات
              </h2>
              <div className="settings-switches">
                <Switch
                  label="إشعارات البريد الإلكتروني"
                  checked={form.emailNotifications}
                  onChange={(v) => change('emailNotifications', v)}
                />
                <Switch
                  label="تنبيه العُهد المتأخرة"
                  checked={form.overdueAdvanceNotifications}
                  onChange={(v) => change('overdueAdvanceNotifications', v)}
                />
                <Switch
                  label="الملخص اليومي"
                  checked={form.dailySummary}
                  onChange={(v) => change('dailySummary', v)}
                />
              </div>
            </section>
          )}
          {tab === 'security' && (
            <section className="settings-panel settings-tab-panel">
              <h2>
                <ShieldCheck /> الأمان
              </h2>
              <div className="settings-grid">
                <Field label="مدة انتهاء الجلسة بالدقائق">
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={form.sessionTimeoutMinutes}
                    onChange={(e) => change('sessionTimeoutMinutes', Number(e.target.value))}
                  />
                </Field>
                <div className="settings-field">
                  <Switch
                    label="فرض كلمات مرور قوية"
                    checked={form.requireStrongPasswords}
                    onChange={(v) => change('requireStrongPasswords', v)}
                  />
                </div>
              </div>
              <p className="settings-note">إدارة المستخدمين والصلاحيات التفصيلية متاحة من صفحة المستخدمين.</p>
            </section>
          )}
          {tab === 'audit' && (
            <section className="settings-panel settings-tab-panel">
              <h2>
                <FileClock /> سجل التغييرات
              </h2>
              <div className="settings-audit">
                {audit.length === 0 ? (
                  <p className="settings-note">لا توجد تغييرات مسجلة بعد.</p>
                ) : (
                  audit.map((entry) => (
                    <article key={entry.id}>
                      <div>
                        <strong>{entry.actorName}</strong>
                        <span>{new Date(entry.createdAt).toLocaleString('ar-EG')}</span>
                      </div>
                      <p>
                        تم تعديل {entry.changedKeys.length} إعداد: {entry.changedKeys.join('، ')}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          )}
          <footer className="settings-savebar">
            <p>
              {saved
                ? 'تم حفظ التغييرات بنجاح.'
                : form.updatedAt
                  ? `آخر حفظ بواسطة ${form.updatedByName || 'مدير النظام'}`
                  : 'لم تُحفظ إعدادات بعد.'}
            </p>
            <div>
              <button
                type="button"
                className="settings-secondary"
                onClick={() => settings && setDraft(settings)}
              >
                استعادة
              </button>
              <button className="settings-primary" disabled={isSaving}>
                <Save size={17} />
                {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </button>
            </div>
          </footer>
        </form>
      )}
    </main>
  )
}
