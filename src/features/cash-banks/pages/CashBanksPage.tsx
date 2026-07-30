import { CashBanksAccounts } from '../components/CashBanksAccounts'
import { CashBanksFlow } from '../components/CashBanksFlow'
import { CashBanksHeader } from '../components/CashBanksHeader'
import { CashBanksMetrics } from '../components/CashBanksMetrics'
import { CashBanksMovements } from '../components/CashBanksMovements'
import { CashBanksQuickActions } from '../components/CashBanksQuickActions'
import { useCashBanks } from '../hooks/useCashBanks'
import '../styles/cash-banks.css'

export function CashBanksPage() {
  const { data, isLoading, error } = useCashBanks()

  if (isLoading) return <section className="cash-banks-state">جاري تحميل الخزنة والبنوك...</section>
  if (error) return <section className="cash-banks-state">{error}</section>
  if (!data) return <section className="cash-banks-state">لا توجد بيانات متاحة.</section>

  return (
    <section className="cash-banks-page">
      <CashBanksHeader asOfDate={data.asOfDate} />
      <CashBanksMetrics metrics={data.metrics} />
      <div className="cash-banks-main-grid">
        <CashBanksFlow points={data.cashFlow} />
        <CashBanksAccounts accounts={data.accounts} />
      </div>
      <div className="cash-banks-bottom-grid">
        <CashBanksMovements movements={data.movements} />
        <CashBanksQuickActions />
      </div>
    </section>
  )
}
