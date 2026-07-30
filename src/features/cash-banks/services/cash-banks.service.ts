import { findCashBanksSnapshot } from '../repositories/cash-banks.repository'
import type { CashBanksViewModel } from '../types/cash-banks.types'

export async function getCashBanksViewModel(): Promise<CashBanksViewModel> {
  return findCashBanksSnapshot()
}
