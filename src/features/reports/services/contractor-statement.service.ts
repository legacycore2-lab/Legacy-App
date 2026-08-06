import type {
  ContractorStatementPayment,
  ContractorStatementSourceEntry,
  ContractorStatementViewModel,
} from '../types/contractor-statement.types'

function compareStatementEntries(
  a: ContractorStatementSourceEntry,
  b: ContractorStatementSourceEntry,
): number {
  const dateComparison = a.entryDate.localeCompare(b.entryDate)
  if (dateComparison !== 0) return dateComparison
  return (a.entryNumber ?? 0) - (b.entryNumber ?? 0)
}

export function buildContractorStatement(
  entries: ContractorStatementSourceEntry[],
  contractorName: string,
): ContractorStatementViewModel {
  const normalizedContractorName = contractorName.trim()
  const sourcePayments = entries
    .filter(
      (entry) =>
        entry.contractorName === normalizedContractorName &&
        entry.entryType === 'expense',
    )
    .slice()
    .sort(compareStatementEntries)

  let runningBalance = 0
  const projects = new Set<string>()
  const payments: ContractorStatementPayment[] = sourcePayments.map((entry) => {
    runningBalance += entry.amount
    if (entry.projectId) projects.add(entry.projectId)

    return {
      id: entry.id,
      entryNumber: entry.entryNumber,
      entryDate: entry.entryDate,
      projectId: entry.projectId,
      projectName: entry.projectName,
      category: entry.category,
      description: entry.description,
      paymentMethod: entry.paymentMethod,
      amount: entry.amount,
      runningBalance,
    }
  })

  return {
    summary: {
      contractorName: normalizedContractorName,
      totalPayments: runningBalance,
      paymentCount: payments.length,
      projectCount: projects.size,
      averagePayment: payments.length > 0 ? runningBalance / payments.length : 0,
      firstPaymentDate: payments[0]?.entryDate ?? null,
      lastPaymentDate: payments.at(-1)?.entryDate ?? null,
      currentBalance: runningBalance,
    },
    payments,
  }
}
