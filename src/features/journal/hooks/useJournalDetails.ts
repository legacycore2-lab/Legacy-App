import { useQuery } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { getJournalDetails } from '../services/journal.service'

export function useJournalDetails(entryId: string | null) {
  const query = useQuery({
    queryKey: ['journal', 'details', entryId],
    queryFn: () => getJournalDetails(entryId ?? ''),
    enabled: Boolean(entryId),
  })

  return {
    details: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل تفاصيل القيد.') : '',
  }
}
