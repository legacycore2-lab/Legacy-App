import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Landmark, Plus, ReceiptText } from 'lucide-react'

export function CashBanksQuickActions({ onDeposit }: { onDeposit: () => void }) {
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
        <button type="button">
          <ArrowUpFromLine />
          <span>سحب</span>
        </button>
        <button type="button">
          <ArrowLeftRight />
          <span>تحويل بين حسابات</span>
        </button>
        <button type="button">
          <Plus />
          <span>حركة جديدة</span>
        </button>
        <button type="button">
          <Landmark />
          <span>حساب جديد</span>
        </button>
        <button type="button">
          <ReceiptText />
          <span>تقرير أرصدة</span>
        </button>
      </div>
    </article>
  )
}
