import { importJournalEntriesAtomic } from '../repositories/journal-import.repository'
import type { JournalImportPreview } from '../types/journal-import.types'

export async function commitJournalImport(preview: JournalImportPreview): Promise<number> {
  if (!preview.canImport || preview.invalidRows > 0) {
    throw new Error('لا يمكن اعتماد الملف قبل معالجة جميع الأخطاء.')
  }

  if (preview.rows.length === 0) throw new Error('لا توجد قيود صالحة للاستيراد.')

  const rows = preview.rows.map((row) => {
    if (
      row.status !== 'valid' ||
      !row.projectId ||
      !row.type ||
      !row.categoryAccountId ||
      !row.paymentAccountId ||
      row.amount === null
    ) {
      throw new Error(`الصف ${row.excelRow} غير مكتمل ولا يمكن اعتماده.`)
    }

    return {
      requestId: crypto.randomUUID(),
      excelRow: row.excelRow,
      entryDate: row.date,
      projectId: row.projectId,
      type: row.type,
      categoryAccountId: row.categoryAccountId,
      description: row.description,
      contractor: row.contractor,
      paymentAccountId: row.paymentAccountId,
      amount: row.amount,
      notes: row.notes,
    }
  })

  const importedIds = await importJournalEntriesAtomic(rows)
  if (importedIds.length !== rows.length) {
    throw new Error('عدد القيود المحفوظة لا يطابق عدد صفوف الملف.')
  }

  return importedIds.length
}
