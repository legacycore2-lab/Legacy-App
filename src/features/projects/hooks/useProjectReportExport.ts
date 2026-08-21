import { useState } from 'react'
import type { ProjectDetailsViewModel, ProjectJournalViewModel } from '../types/project.types'
import { exportProjectReportExcel, exportProjectReportWord } from '../services/project-report-export.service'

type ExportInput = {
  viewModel: ProjectDetailsViewModel
  journalViewModel: ProjectJournalViewModel | null | undefined
}

export function useProjectReportExport(input: ExportInput) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  async function run(action: () => void | Promise<void>) {
    setIsExporting(true)
    setExportError('')
    try {
      await action()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'تعذر تصدير التقرير.')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isExporting,
    exportError,
    exportExcel: () => void run(() => exportProjectReportExcel(input)),
    exportWord: () => void run(() => exportProjectReportWord(input)),
  }
}
