import { useCallback, useState } from 'react'
import { toErrorMessage } from '../../../shared/errors/app-error'
import {
  downloadJournalImportTemplate,
  parseJournalImportFile,
} from '../services/journal-import.service'
import type { JournalImportPreview } from '../types/journal-import.types'

export function useJournalImport() {
  const [preview, setPreview] = useState<JournalImportPreview | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')

  const reset = useCallback(() => {
    setPreview(null)
    setError('')
    setIsParsing(false)
  }, [])

  const loadFile = useCallback(async (file: File) => {
    setIsParsing(true)
    setError('')
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

  return {
    preview,
    isParsing,
    isDownloading,
    error,
    loadFile,
    downloadTemplate,
    reset,
  }
}
