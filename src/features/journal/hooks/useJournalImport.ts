import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import { commitJournalImport } from '../services/journal-import-posting.service'
import { downloadJournalImportTemplate, parseJournalImportFile } from '../services/journal-import.service'
import type { JournalImportPreview } from '../types/journal-import.types'

export function useJournalImport() {
  const queryClient = useQueryClient()
  const [preview, setPreview] = useState<JournalImportPreview | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const reset = useCallback(() => {
    setPreview(null)
    setError('')
    setSuccess('')
    setIsParsing(false)
    setIsImporting(false)
  }, [])

  const loadFile = useCallback(async (file: File) => {
    setIsParsing(true)
    setError('')
    setSuccess('')
    setPreview(null)

    try {
      setPreview(await parseJournalImportFile(file))
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'تعذر قراءة ملف Excel.'))
    } finally {
      setIsParsing(false)
    }
  }, [])

  const downloadTemplate = useCallback(async () => {
    setIsDownloading(true)
    setError('')

    try {
      await downloadJournalImportTemplate()
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'تعذر إنشاء نموذج الاستيراد.'))
    } finally {
      setIsDownloading(false)
    }
  }, [])

  const importEntries = useCallback(async () => {
    if (!preview) return

    setIsImporting(true)
    setError('')
    setSuccess('')

    try {
      const importedCount = await commitJournalImport(preview)
      setSuccess(`تم استيراد ${importedCount} قيد بنجاح.`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['journal'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['contractors'] }),
        queryClient.invalidateQueries({ queryKey: ['project-details'] }),
        queryClient.invalidateQueries({ queryKey: ['project-activity'] }),
        queryClient.invalidateQueries({ queryKey: ['project-contractors'] }),
      ])
    } catch (caughtError) {
      setError(toErrorMessage(caughtError, 'تعذر اعتماد الاستيراد. لم يتم حفظ أي قيد.'))
    } finally {
      setIsImporting(false)
    }
  }, [preview, queryClient])

  return {
    preview,
    isParsing,
    isDownloading,
    isImporting,
    error,
    success,
    loadFile,
    downloadTemplate,
    importEntries,
    reset,
  }
}
