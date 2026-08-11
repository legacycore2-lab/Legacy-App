import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  deleteEntryAttachment,
  getEntryAttachmentUrl,
  listEntryAttachments,
  retryEntryAttachmentCleanup,
  uploadEntryAttachment,
} from '../../../shared/attachments/entry-attachments.service'
import type { EntryAttachmentCleanupWarning } from '../../../shared/attachments/entry-attachment.types'

function attachmentsKey(entryId: string) {
  return ['journal-attachments', entryId] as const
}

export function useJournalAttachments(entryId: string | null) {
  const query = useQuery({
    queryKey: attachmentsKey(entryId ?? ''),
    queryFn: () => listEntryAttachments(entryId!),
    enabled: Boolean(entryId),
    staleTime: 30_000,
  })

  return {
    attachments: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? toErrorMessage(query.error, 'تعذر تحميل مرفقات القيد.') : '',
  }
}

export function useJournalAttachmentActions(entryId: string) {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: attachmentsKey(entryId) })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadEntryAttachment(entryId, file),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) => deleteEntryAttachment(attachmentId),
    onSuccess: invalidate,
  })

  const openMutation = useMutation({
    mutationFn: (storagePath: string) => getEntryAttachmentUrl(storagePath),
  })

  const cleanupMutation = useMutation({
    mutationFn: (storagePath: string) => retryEntryAttachmentCleanup(storagePath),
  })

  return {
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error ? toErrorMessage(uploadMutation.error, 'تعذر رفع المرفق.') : '',
    remove: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error ? toErrorMessage(deleteMutation.error, 'تعذر حذف المرفق.') : '',
    cleanupWarning:
      deleteMutation.data?.kind === 'cleanup_warning'
        ? (deleteMutation.data as EntryAttachmentCleanupWarning)
        : null,
    getUrl: openMutation.mutateAsync,
    isOpening: openMutation.isPending,
    openError: openMutation.error ? toErrorMessage(openMutation.error, 'تعذر فتح المرفق.') : '',
    retryCleanup: cleanupMutation.mutateAsync,
    isRetryingCleanup: cleanupMutation.isPending,
    cleanupResult: cleanupMutation.data,
  }
}
