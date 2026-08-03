import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isPermissionError, toErrorMessage } from '../../../shared/errors/app-error'
import {
  deleteAttachment,
  getAttachmentSignedUrl,
  listProjectAttachments,
  retryStorageCleanup,
  uploadAttachment,
} from '../services/project-attachments.service'
import type {
  Attachment,
  AttachmentCleanupWarning,
  AttachmentUploadInput,
  DeleteAttachmentResult,
  RetryCleanupResult,
} from '../types/project-attachment.types'

function attachmentsKey(projectId: string) {
  return ['project-attachments', projectId] as const
}

// ─── List ─────────────────────────────────────────────────────────────────────

export function useProjectAttachments(projectId: string | null): {
  attachments: Attachment[]
  isLoading: boolean
  error: string
  isPermissionDenied: boolean
} {
  const { data, isLoading, error } = useQuery({
    queryKey: attachmentsKey(projectId ?? ''),
    queryFn: () => listProjectAttachments(projectId!),
    enabled: !!projectId,
    staleTime: 30_000,
  })

  return {
    attachments: data ?? [],
    isLoading,
    error: error ? toErrorMessage(error, 'تعذر تحميل المرفقات.') : '',
    isPermissionDenied: isPermissionError(error),
  }
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export function useUploadAttachment(projectId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (input: AttachmentUploadInput) => uploadAttachment(input),
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: attachmentsKey(projectId) }),
        queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] }),
      ])
    },
  })

  return {
    upload: mutation.mutateAsync,
    isUploading: mutation.isPending,
    uploadError: mutation.error ? toErrorMessage(mutation.error, 'فشل رفع الملف.') : '',
    reset: mutation.reset,
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export function useDeleteAttachment(
  projectId: string,
  onCleanupWarning?: (warning: AttachmentCleanupWarning) => void,
) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
    onSuccess: (result: DeleteAttachmentResult) => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: attachmentsKey(projectId) }),
        queryClient.invalidateQueries({ queryKey: ['project-activity', projectId] }),
      ])
      if (result.kind === 'cleanup_warning' && onCleanupWarning) {
        onCleanupWarning(result)
      }
    },
  })

  return {
    remove: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error ? toErrorMessage(mutation.error, 'فشل حذف المرفق.') : '',
  }
}

// ─── Signed URL (on-demand) ───────────────────────────────────────────────────

export function useAttachmentSignedUrl() {
  const mutation = useMutation({
    mutationFn: ({ storagePath, expiresInSeconds }: { storagePath: string; expiresInSeconds?: number }) =>
      getAttachmentSignedUrl(storagePath, expiresInSeconds),
  })

  return {
    getUrl: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error ? toErrorMessage(mutation.error, 'تعذر فتح الملف.') : '',
  }
}

// ─── Retry cleanup ────────────────────────────────────────────────────────────

export function useRetryCleanup() {
  const mutation = useMutation({
    mutationFn: (storagePath: string) => retryStorageCleanup(storagePath),
  })

  return {
    retry: mutation.mutateAsync,
    isRetrying: mutation.isPending,
    result: mutation.data as RetryCleanupResult | undefined,
    reset: mutation.reset,
  }
}
