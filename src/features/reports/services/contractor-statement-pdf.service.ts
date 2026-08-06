import { formatMoneyInteger } from '../../../shared/formatters'
import { COMPANY_NAME } from '../config/pdf-brand.config'
import { buildContractorStatement } from './contractor-statement.service'
import type { ContractorReportsFilters, ContractorReportsViewModel } from '../types/contractor-reports.types'
import type { PdfActiveFilter, PdfExportPayload } from '../types/pdf-export.types'

export function buildContractorStatementPdfPayload(
  data: ContractorReportsViewModel,
  filters: ContractorReportsFilters,
): PdfExportPayload {
  const statement = buildContractorStatement(data.entries, filters.contractorName)
  const { summary } = statement
  const activeFilters: PdfActiveFilter[] = []

  if (filters.contractorName) activeFilters.push({ label: 'المقاول', value: filters.contractorName })
  if (filters.projectId) {
    const projectName = data.projectOptions.find((project) => project.id === filters.projectId)?.name
    activeFilters.push({ label: 'المشروع', value: projectName ?? filters.projectId })
  }
  if (filters.dateFrom) activeFilters.push({ label: 'من', value: filters.dateFrom })
  if (filters.dateTo) activeFilters.push({ label: 'إلى', value: filters.dateTo })

  return {
    reportTitle: 'كشف حساب المقاول',
    companyName: COMPANY_NAME,
    exportDate: new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    activeTab: 'contractor-statement',
    activeFilters,
    kpis: [
      { label: 'إجمالي المدفوعات', value: formatMoneyInteger(summary.totalPayments) },
      { label: 'عدد الدفعات', value: String(summary.paymentCount) },
      { label: 'عدد المشاريع', value: String(summary.projectCount) },
      { label: 'متوسط الدفعة', value: formatMoneyInteger(summary.averagePayment) },
      { label: 'الرصيد التراكمي', value: formatMoneyInteger(summary.currentBalance) },
    ],
    tables: [
      {
        title: 'تفاصيل دفعات المقاول',
        headers: [
          '#',
          'التاريخ',
          'رقم القيد',
          'المشروع',
          'البند',
          'البيان',
          'طريقة الدفع',
          'قيمة الدفعة',
          'الرصيد بعد الحركة',
        ],
        rows: statement.payments.map((payment, index) => [
          index + 1,
          payment.entryDate,
          payment.entryNumber ?? '—',
          payment.projectName,
          payment.category,
          payment.description,
          payment.paymentMethod,
          formatMoneyInteger(payment.amount),
          formatMoneyInteger(payment.runningBalance),
        ]),
      },
      {
        title: 'ملخص الحساب',
        headers: ['البيان', 'القيمة'],
        rows: [
          ['إجمالي المدفوعات', formatMoneyInteger(summary.totalPayments)],
          ['عدد الدفعات', summary.paymentCount],
          ['عدد المشاريع', summary.projectCount],
          ['متوسط الدفعة', formatMoneyInteger(summary.averagePayment)],
          ['أول دفعة', summary.firstPaymentDate ?? '—'],
          ['آخر دفعة', summary.lastPaymentDate ?? '—'],
          ['الرصيد الحالي', formatMoneyInteger(summary.currentBalance)],
        ],
      },
    ],
  }
}
