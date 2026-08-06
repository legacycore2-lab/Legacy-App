import { formatAccountingDate } from '../../../shared/date-utils'
import { formatMoneyInteger } from '../../../shared/formatters'
import type { ContractorStatementViewModel } from '../types/contractor-statement.types'

type Props = {
  statement: ContractorStatementViewModel
  dateFrom: string
  dateTo: string
}

export function ContractorStatementPanel({ statement, dateFrom, dateTo }: Props) {
  const { summary, payments } = statement

  if (!summary.contractorName) {
    return (
      <div className="contractor-statement-empty" role="status">
        <strong>اختر مقاولًا ثم اضغط بحث</strong>
        <span>سيظهر كشف حساب دفعات المقاول مرتبًا بالتاريخ مع الرصيد التراكمي.</span>
      </div>
    )
  }

  return (
    <article className="contractor-statement" aria-label={`كشف حساب ${summary.contractorName}`}>
      <header className="contractor-statement__hero">
        <div>
          <span>Legacy Core ERP</span>
          <h3>كشف حساب المقاول</h3>
          <p>تقرير رسمي بالدفعات المسجلة والرصيد التراكمي لكل حركة.</p>
        </div>
        <dl>
          <div>
            <dt>المقاول</dt>
            <dd>{summary.contractorName}</dd>
          </div>
          <div>
            <dt>الفترة</dt>
            <dd>{formatPeriod(dateFrom, dateTo)}</dd>
          </div>
          <div>
            <dt>عدد المشاريع</dt>
            <dd>{summary.projectCount}</dd>
          </div>
        </dl>
      </header>

      <section className="contractor-statement__kpis" aria-label="ملخص كشف الحساب">
        <StatementKpi label="إجمالي المدفوعات" value={formatMoneyInteger(summary.totalPayments)} />
        <StatementKpi label="عدد الدفعات" value={String(summary.paymentCount)} />
        <StatementKpi label="متوسط الدفعة" value={formatMoneyInteger(summary.averagePayment)} />
        <StatementKpi label="أول دفعة" value={formatAccountingDate(summary.firstPaymentDate)} />
        <StatementKpi label="آخر دفعة" value={formatAccountingDate(summary.lastPaymentDate)} />
        <StatementKpi label="الرصيد التراكمي" value={formatMoneyInteger(summary.currentBalance)} featured />
      </section>

      <section className="contractor-statement__ledger">
        <div className="contractor-statement__section-title">
          <div>
            <span>تفاصيل الدفعات</span>
            <h4>الحركات مرتبة من الأقدم إلى الأحدث</h4>
          </div>
          <strong>{summary.paymentCount} دفعة</strong>
        </div>

        <div className="contractor-statement__table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>التاريخ</th>
                <th>رقم القيد</th>
                <th>المشروع</th>
                <th>البند</th>
                <th>البيان</th>
                <th>طريقة الدفع</th>
                <th>قيمة الدفعة</th>
                <th>الرصيد بعد الحركة</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={9}>لا توجد دفعات مسجلة للمقاول خلال الفترة المختارة.</td>
                </tr>
              ) : (
                payments.map((payment, index) => (
                  <tr key={payment.id}>
                    <td>{index + 1}</td>
                    <td>{formatAccountingDate(payment.entryDate)}</td>
                    <td>{payment.entryNumber ?? '—'}</td>
                    <td>{payment.projectName}</td>
                    <td>{payment.category}</td>
                    <td>{payment.description}</td>
                    <td>{payment.paymentMethod}</td>
                    <td>{formatMoneyInteger(payment.amount)}</td>
                    <td>{formatMoneyInteger(payment.runningBalance)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {payments.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={7}>الإجمالي</td>
                  <td>{formatMoneyInteger(summary.totalPayments)}</td>
                  <td>{formatMoneyInteger(summary.currentBalance)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <section className="contractor-statement__closing">
        <div className="contractor-statement__notes">
          <span>ملاحظات</span>
          <p>
            ............................................................................................................................
          </p>
          <p>
            ............................................................................................................................
          </p>
        </div>
        <dl className="contractor-statement__summary">
          <div>
            <dt>إجمالي المدفوعات</dt>
            <dd>{formatMoneyInteger(summary.totalPayments)}</dd>
          </div>
          <div>
            <dt>عدد الدفعات</dt>
            <dd>{summary.paymentCount}</dd>
          </div>
          <div>
            <dt>متوسط الدفعة</dt>
            <dd>{formatMoneyInteger(summary.averagePayment)}</dd>
          </div>
          <div>
            <dt>الرصيد الحالي</dt>
            <dd>{formatMoneyInteger(summary.currentBalance)}</dd>
          </div>
        </dl>
      </section>

      <footer className="contractor-statement__approval">
        <Approval label="إعداد" />
        <Approval label="مراجعة" />
        <Approval label="اعتماد" />
      </footer>
    </article>
  )
}

function StatementKpi({
  label,
  value,
  featured = false,
}: {
  label: string
  value: string
  featured?: boolean
}) {
  return (
    <div className={featured ? 'is-featured' : undefined}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Approval({ label }: { label: string }) {
  return (
    <div>
      <span>{label}</span>
      <i aria-hidden />
      <small>الاسم والتوقيع</small>
    </div>
  )
}

function formatPeriod(dateFrom: string, dateTo: string): string {
  if (dateFrom && dateTo) {
    return `${formatAccountingDate(dateFrom)} — ${formatAccountingDate(dateTo)}`
  }
  if (dateFrom) return `من ${formatAccountingDate(dateFrom)}`
  if (dateTo) return `حتى ${formatAccountingDate(dateTo)}`
  return 'كل الفترات'
}
