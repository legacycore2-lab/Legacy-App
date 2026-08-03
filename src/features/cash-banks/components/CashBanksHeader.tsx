import { CalendarDays, Plus } from 'lucide-react'

export function CashBanksHeader({ asOfDate, onCreate }: { asOfDate: string; onCreate: () => void }) {
  return (
    <header className="cash-banks-hero">
      <div>
        <span className="cash-banks-eyebrow">الإدارة المالية</span>
        <h1>الخزنة والبنوك</h1>
        <p>مركز موحد لمراقبة السيولة والحسابات والحركات اليومية.</p>
      </div>
      <div className="cash-banks-hero__actions">
        <span className="cash-banks-date">
          <CalendarDays size={17} />
          {asOfDate}
        </span>
        <button className="cash-banks-primary" type="button" onClick={onCreate}>
          <Plus size={18} />
          حساب جديد
        </button>
      </div>
    </header>
  )
}
