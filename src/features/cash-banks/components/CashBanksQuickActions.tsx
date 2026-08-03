import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Landmark } from 'lucide-react'

export function CashBanksQuickActions({
  onDeposit,
  onWithdrawal,
  onTransfer,
  onCreateAccount,
}: {
  onDeposit: () => void
  onWithdrawal: () => void
  onTransfer: () => void
  onCreateAccount: () => void
}) {
  return (
    <article className="cash-banks-panel cash-banks-quick">
      <div className="cash-banks-panel__header">
        <div>
          <span>اختصارات تشغيلية</span>
          <h2>إجراءات سريعة</h2>
        </div>
      </div>
      <div className="cash-banks-quick__grid">
        <button type="button" onClick={onDeposit}>
          <ArrowDownToLine />
          <span>إيداع</span>
        </button>
        <button type="button" onClick={onWithdrawal}>
          <ArrowUpFromLine />
          <span>سحب</span>
        </button>
        <button type="button" onClick={onTransfer}>
          <ArrowLeftRight />
          <span>تحويل بين حسابات</span>
        </button>
        <button type="button" onClick={onCreateAccount}>
          <Landmark />
          <span>حساب جديد</span>
        </button>
      </div>
    </article>
  )
}
