import { findAdvanceNotificationData } from '../repositories/notifications.repository'

export interface SystemNotification {
  id: string
  title: string
  description: string
}

export async function getSystemNotifications(): Promise<SystemNotification[]> {
  const { config, rows } = await findAdvanceNotificationData()
  const overdue = rows.filter(
    (item) => Number(item.amount) > Number(item.spent_amount) + Number(item.returned_amount),
  )
  const notifications =
    config.overdueAdvanceNotifications === false
      ? []
      : overdue.map((item) => ({
          id: item.id,
          title: `عهدة متأخرة: ${item.holder_name}`,
          description: `تاريخ الاستحقاق ${item.due_date}`,
        }))
  if (config.dailySummary && overdue.length > 0) {
    notifications.unshift({
      id: 'daily-advance-summary',
      title: 'الملخص اليومي',
      description: `${overdue.length} عهدة متأخرة تحتاج إلى المتابعة اليوم`,
    })
  }
  return notifications
}
