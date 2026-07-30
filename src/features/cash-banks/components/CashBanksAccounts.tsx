import { Banknote, Landmark, MoreVertical } from 'lucide-react'
import type { CashBankAccount } from '../types/cash-banks.types'

export function CashBanksAccounts({ accounts }: { accounts: CashBankAccount[] }) {
  return (
    <article className="cash-banks-panel">
      <div className="cash-banks-panel__header">
        <div>
          <span>الحسابات النشطة</span>
          <h2>الحسابات الرئيسية</h2>
        </div>
        <button type="button">عرض الكل</button>
      </div>
      <div className="cash-banks-account-grid">
        {accounts.map((account) => (
          <div
            className={`cash-banks-account cash-banks-tone--${account.tone}`}
            key={account.id}
          >
            <div className="cash-banks-account__top">
              <div className="cash-banks-account__icon">
                {account.kind === 'bank' ? <Landmark /> : <Banknote />}
              </div>
              <button type="button">
                <MoreVertical size={17} />
              </button>
            </div>
            <span>{account.name}</span>
            <strong>{account.balance}</strong>
            <div className="cash-banks-progress">
              <i style={{ width: `${account.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  )
}
