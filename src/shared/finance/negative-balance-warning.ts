type NegativeBalanceConfirmationInput = {
  accountName: string
  currentBalance: number
  amount: number
}

const money = (value: number) => `${value.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`

export function confirmNegativeBalance({
  accountName,
  currentBalance,
  amount,
}: NegativeBalanceConfirmationInput): boolean {
  const projectedBalance = currentBalance - amount
  if (!Number.isFinite(amount) || amount <= 0 || projectedBalance >= 0) return true

  return window.confirm(
    `تحذير: رصيد ${accountName} الحالي ${money(currentBalance)}، وبعد العملية سيصبح ${money(projectedBalance)}.\n\nهل تريد الاستمرار؟`,
  )
}
