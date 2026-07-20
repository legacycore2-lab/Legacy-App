const priorities = [
  {
    title: 'مراجعة مشروع تجاوز الميزانية',
    description: 'قبل الساعة 10:00 ص',
    tone: 'danger',
  },
  {
    title: 'متابعة دفعة مستحقة من العميل',
    description: 'اليوم · مشروع قيد التنفيذ',
    tone: 'warning',
  },
  {
    title: 'اعتماد تقرير المصروفات',
    description: 'مراجعة إدارية',
    tone: 'success',
  },
] as const

export function DailyPrioritiesPanel() {
  return (
    <section className="command-panel command-panel--tasks">
      <header className="command-panel__header">
        <div>
          <span>أولوية اليوم</span>
          <h2>المهام والتنبيهات</h2>
        </div>
        <span className="command-panel__badge">{priorities.length}</span>
      </header>

      <div className="task-list">
        {priorities.map((priority) => (
          <article key={priority.title}>
            <span className={`task-dot task-dot--${priority.tone}`} />
            <div>
              <strong>{priority.title}</strong>
              <span>{priority.description}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
