import type { DashboardProjectEntryRecord } from '../repositories/dashboard-project-balances.repository'

export function buildDashboardProjectBalances(
  entries: DashboardProjectEntryRecord[],
): ReadonlyMap<string, number> {
  const balances = new Map<string, number>()

  for (const entry of entries) {
    const amount = Number(entry.amount ?? 0)
    if (!Number.isFinite(amount)) continue

    const currentBalance = balances.get(entry.project_id) ?? 0
    const signedAmount = entry.type === 'i' ? amount : -amount
    balances.set(entry.project_id, currentBalance + signedAmount)
  }

  return balances
}
