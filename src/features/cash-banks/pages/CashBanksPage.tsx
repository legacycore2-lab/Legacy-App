import { CashBanksAccounts } from '../components/CashBanksAccounts'
import { CashBankAccountDialog } from '../components/CashBankAccountDialog'
import { CashBankDepositDialog } from '../components/CashBankDepositDialog'
import { CashBankWithdrawalDialog } from '../components/CashBankWithdrawalDialog'
import { CashBankTransferDialog } from '../components/CashBankTransferDialog'
import { CashBankReversalDialog } from '../components/CashBankReversalDialog'
import { CashBanksFlow } from '../components/CashBanksFlow'
import { CashBanksHeader } from '../components/CashBanksHeader'
import { CashBanksMetrics } from '../components/CashBanksMetrics'
import { CashBanksMovements } from '../components/CashBanksMovements'
import { CashBanksQuickActions } from '../components/CashBanksQuickActions'
import { useCashBanks } from '../hooks/useCashBanks'
import { useCashBankMovements } from '../hooks/useCashBankMovements'
import { useCashBankAccountForm } from '../hooks/useCashBankAccountForm'
import { useCashBankDepositForm } from '../hooks/useCashBankDepositForm'
import { useCashBankWithdrawalForm } from '../hooks/useCashBankWithdrawalForm'
import { useCashBankTransferForm } from '../hooks/useCashBankTransferForm'
import { useCashBankReversalForm } from '../hooks/useCashBankReversalForm'
import '../styles/cash-banks.css'

export function CashBanksPage() {
  const { data, isLoading, error } = useCashBanks()
  const movements = useCashBankMovements()
  const accountForm = useCashBankAccountForm()
  const depositForm = useCashBankDepositForm()
  const withdrawalForm = useCashBankWithdrawalForm()
  const transferForm = useCashBankTransferForm()
  const reversalForm = useCashBankReversalForm()

  if (isLoading) return <section className="cash-banks-state">جاري تحميل الخزنة والبنوك...</section>
  if (error) return <section className="cash-banks-state">{error}</section>
  if (!data) return <section className="cash-banks-state">لا توجد بيانات متاحة.</section>

  return (
    <section className="cash-banks-page">
      <CashBanksHeader asOfDate={data.asOfDate} onCreate={accountForm.openCreate} />
      <CashBanksMetrics metrics={data.metrics} />
      <div className="cash-banks-main-grid">
        <CashBanksFlow points={data.cashFlow} />
        <CashBanksAccounts accounts={data.accounts} onEdit={(id) => void accountForm.openEdit(id)} />
      </div>
      <CashBankAccountDialog form={accountForm} />
      <CashBankDepositDialog form={depositForm} />
      <CashBankWithdrawalDialog form={withdrawalForm} />
      <CashBankTransferDialog form={transferForm} />
      <CashBankReversalDialog form={reversalForm} />
      <div className="cash-banks-bottom-grid">
        <CashBanksMovements
          movements={movements.movements}
          accounts={data.accounts}
          filters={movements.filters}
          onFiltersChange={movements.onFiltersChange}
          onResetFilters={movements.onResetFilters}
          page={movements.page}
          totalPages={movements.totalPages}
          totalCount={movements.totalCount}
          onPreviousPage={movements.onPreviousPage}
          onNextPage={movements.onNextPage}
          isLoading={movements.isLoading}
          onReverse={reversalForm.open}
        />
        <CashBanksQuickActions
          onDeposit={depositForm.open}
          onWithdrawal={withdrawalForm.open}
          onTransfer={transferForm.open}
          onCreateAccount={accountForm.openCreate}
        />
      </div>
    </section>
  )
}
