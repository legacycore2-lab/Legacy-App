import { useQuery } from '@tanstack/react-query'
import { getSystemNotifications } from '../services/notifications.service'

export function useSystemNotifications() {
  const query = useQuery({
    queryKey: ['system-notifications'],
    queryFn: getSystemNotifications,
    refetchInterval: 60_000,
  })
  return query.data ?? []
}
