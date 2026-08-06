/**
 * contractor-statement-renderer.service.ts
 *
 * Builds the PdfTemplateInput for contractor statement reports
 * and delegates rendering to the unified pdf-template.renderer.
 */

import { downloadPdfTemplate } from './pdf-template.renderer'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { ContractorStatementViewModel } from '../types/contractor-statement.types'
import type { ContractorReportsFilters } from '../types/contractor-reports.types'

const DEFAULT_NOTE = 'جميع المبالغ المذكورة أعلاه تمثل كافة المدفوعات الفعلية للمقاول خلال الفترة المحددة.'

export async function downloadContractorStatementPdf(
  statement: ContractorStatementViewModel,
  filters: ContractorReportsFilters,
  projectOptions: { id: string; name: string }[],
  filename: string,
): Promise<void> {
  const { summary, payments } = statement

  const projectName = filters.projectId
    ? (projectOptions.find((p) => p.id === filters.projectId)?.name ?? filters.projectId)
    : '—'

  await downloadPdfTemplate(
    {
      reportTitle: 'كشف حساب المقاول',
      reportSubtitle: 'تقرير المدفوعات',
      infoItems: [
        { label: 'المقاول', value: filters.contractorName || '—' },
        { label: 'المشروع', value: projectName },
        {
          label: 'الفترة',
          value: filters.dateFrom ? `${filters.dateFrom} إلى ${filters.dateTo}` : '—',
        },
        {
          label: 'تاريخ التقرير',
          value: new Date().toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }),
        },
      ],
      kpis: [
        { label: 'إجمالي المدفوعات', value: formatMoneyInteger(summary.totalPayments) },
        { label: 'عدد الدفعات', value: String(summary.paymentCount) },
        { label: 'عدد المشاريع', value: String(summary.projectCount) },
        {
          label: 'متوسط الدفعة',
          value: formatMoneyInteger(summary.averagePayment),
          highlight: true,
        },
        { label: 'أول دفعة', value: summary.firstPaymentDate ?? '—' },
        { label: 'آخر دفعة', value: summary.lastPaymentDate ?? '—' },
      ],
      tables: [
        {
          title: 'تفاصيل الدفعات',
          headers: [
            '#',
            'التاريخ',
            'رقم القيد',
            'المشروع',
            'البند',
            'البيان',
            'طريقة الدفع',
            'قيمة الدفعة',
            'الرصيد التراكمي',
          ],
          rows: payments.map((p, i) => [
            i + 1,
            p.entryDate,
            p.entryNumber ?? '—',
            p.projectName,
            p.category,
            p.description,
            p.paymentMethod,
            formatMoneyInteger(p.amount),
            formatMoneyInteger(p.runningBalance),
          ]),
          paymentMethodCol: 6,
          balanceCol: 8,
          paymentMethods: payments.map((p) => p.paymentMethod),
        },
      ],
      totalBar: {
        label: 'إجمالي المدفوعات',
        value: formatMoneyInteger(summary.totalPayments),
        note: DEFAULT_NOTE,
      },
      notes: { text: DEFAULT_NOTE },
      signatures: [
        { title: 'إعداد المحاسب' },
        { title: 'مراجعة مدير المشروع' },
        { title: 'اعتماد المدير المالي' },
      ],
    },
    filename,
  )
}
