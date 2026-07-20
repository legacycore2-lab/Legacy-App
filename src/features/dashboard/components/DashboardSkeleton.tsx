const KPI_SKELETONS = ['balance', 'income', 'expense', 'advances']
const PANEL_SKELETONS = ['projects', 'activity', 'alerts']
const ACTION_SKELETONS = ['project', 'entry', 'advance', 'transfer']

function SkeletonLine({ width }: { width: string }) {
  return <span className="dashboard-skeleton__line" style={{ width }} />
}

export function DashboardSkeleton() {
  return (
    <section
      className="dashboard-details dashboard-command-center dashboard-skeleton"
      aria-busy="true"
      aria-label="جاري تحميل لوحة التحكم"
    >
      <span className="dashboard-skeleton__status" role="status">
        جاري تجهيز مركز القيادة...
      </span>

      <header className="dashboard-skeleton__header" aria-hidden="true">
        <div>
          <SkeletonLine width="120px" />
          <SkeletonLine width="260px" />
        </div>
        <span className="dashboard-skeleton__control" />
      </header>

      <div className="dashboard-skeleton__kpis" aria-hidden="true">
        {KPI_SKELETONS.map((item) => (
          <article key={item} className="dashboard-skeleton__card dashboard-skeleton__kpi">
            <span className="dashboard-skeleton__icon" />
            <SkeletonLine width="42%" />
            <SkeletonLine width="68%" />
            <SkeletonLine width="34%" />
          </article>
        ))}
      </div>

      <div className="dashboard-skeleton__panels" aria-hidden="true">
        {PANEL_SKELETONS.map((panel, panelIndex) => (
          <article key={panel} className="dashboard-skeleton__card dashboard-skeleton__panel">
            <div className="dashboard-skeleton__panel-header">
              <div>
                <SkeletonLine width="74px" />
                <SkeletonLine width="132px" />
              </div>
              <span className="dashboard-skeleton__icon dashboard-skeleton__icon--small" />
            </div>

            <div className="dashboard-skeleton__rows">
              {Array.from({ length: panelIndex === 0 ? 3 : 4 }, (_, rowIndex) => (
                <div key={rowIndex} className="dashboard-skeleton__row">
                  <span className="dashboard-skeleton__icon dashboard-skeleton__icon--small" />
                  <div>
                    <SkeletonLine width={`${72 - rowIndex * 6}%`} />
                    <SkeletonLine width={`${48 + rowIndex * 5}%`} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="dashboard-skeleton__actions" aria-hidden="true">
        {ACTION_SKELETONS.map((action) => (
          <article key={action} className="dashboard-skeleton__card dashboard-skeleton__action">
            <span className="dashboard-skeleton__icon" />
            <div>
              <SkeletonLine width="110px" />
              <SkeletonLine width="150px" />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
