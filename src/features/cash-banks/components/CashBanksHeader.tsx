import { CalendarDays, Plus } from 'lucide-react'

export function CashBanksHeader({ asOfDate }: { asOfDate: string }) {
  return (
    <header className="cash-banks-hero">
      <div>
        <span className="cash-banks-eyebrow">الإدارة المالية</span>
        <h1>الخزنة والبنوك</h1>
        <p>مركز موحد لمراقبة السيولة والحسابات والحركات اليومية.</p>
      </div>
      <div className="cash-banks-hero__actions">
        <button className="cash-banks-date" type="button">
          <CalendarDays size={17} />
          {asOfDate}
        </button>
        <button className="cash-banks-primary" type="button">
          <Plus size={18} />
          حساب جديد
        </button>
      </div>
    </header>
  )
}
