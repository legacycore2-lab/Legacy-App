import * as XLSX from 'xlsx'
import { findJournalPostingOptions } from '../repositories/journal.repository'
import type { JournalPostingOptions } from '../types/journal-entry.types'
import type {
  JournalImportLimits,
  JournalImportPreview,
  JournalImportRow,
} from '../types/journal-import.types'
import type { JournalEntryType } from '../types/journal.types'

const SHEET_NAME = 'Journal'
const TEMPLATE_FILE_NAME = 'LegacyCore_Journal_Template.xlsx'

export const journalImportLimits: JournalImportLimits = {
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxRows: 1000,
}

const requiredHeaders = ['Project', 'Date', 'Type', 'Category', 'Description', 'Amount'] as const
const allHeaders = [
  'Project',
  'Date',
  'Type',
  'Category',
  'Description',
  'Contractor',
  'Payment Method',
  'Amount',
  'Notes',
] as const

type RawImportRow = Record<string, unknown>

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLookup(value: string): string {
  return value
    .toLocaleLowerCase('ar-EG')
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/ـ/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[–—−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseType(value: string): JournalEntryType | null {
  const normalized = normalizeLookup(value)
  if (['income', 'revenue', 'ايراد'].includes(normalized)) return 'income'
  if (['expense', 'expenses', 'مصروف'].includes(normalized)) return 'expense'
  return null
}

function parseAmount(value: unknown): number | null {
  const amount = typeof value === 'number' ? value : Number(normalizeText(value).replace(/,/g, ''))
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

function excelSerialToIsoDate(value: number): string | null {
  const parsed = XLSX.SSF.parse_date_code(value)
  if (!parsed) return null

  const year = String(parsed.y).padStart(4, '0')
  const month = String(parsed.m).padStart(2, '0')
  const day = String(parsed.d).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(value: unknown): string | null {
  if (typeof value === 'number') return excelSerialToIsoDate(value)

  const text = normalizeText(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null

  const parsed = new Date(`${text}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text ? null : text
}

function findProject(options: JournalPostingOptions, value: string) {
  const key = normalizeLookup(value)
  return options.projects.find((project) => normalizeLookup(project.name) === key) ?? null
}

function extractAccountCode(value: string): string {
  const match = normalizeText(value).match(/^([^\s–—-]+)\s*[–—-]\s*.+$/)
  return match?.[1]?.trim() ?? ''
}

function findAccount(
  options: JournalPostingOptions,
  value: string,
  allowedTypes: Array<'asset' | 'revenue' | 'expense'>,
) {
  const key = normalizeLookup(value)
  const extractedCode = normalizeLookup(extractAccountCode(value))

  return (
    options.accounts.find((account) => {
      if (!allowedTypes.includes(account.accountType)) return false

      const normalizedName = normalizeLookup(account.name)
      const normalizedCode = normalizeLookup(account.code)
      return (
        normalizedName === key ||
        normalizedCode === key ||
        (extractedCode && normalizedCode === extractedCode)
      )
    }) ?? null
  )
}

function buildDuplicateKey(row: JournalImportRow): string {
  return [
    row.projectId,
    row.date,
    row.type,
    row.categoryAccountId,
    normalizeLookup(row.description),
    row.amount,
  ].join('|')
}

function validateHeaders(sheet: XLSX.WorkSheet): void {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false })
  const headers = (rows[0] ?? []).map(normalizeText)
  const missing = requiredHeaders.filter((header) => !headers.includes(header))

  if (missing.length > 0) {
    throw new Error(`الأعمدة الإلزامية المفقودة: ${missing.join('، ')}`)
  }
}

function mapRow(raw: RawImportRow, excelRow: number, options: JournalPostingOptions): JournalImportRow {
  const projectName = normalizeText(raw.Project)
  const date = parseDate(raw.Date)
  const type = parseType(normalizeText(raw.Type))
  const category = normalizeText(raw.Category)
  const description = normalizeText(raw.Description)
  const contractor = normalizeText(raw.Contractor)
  const paymentMethod = normalizeText(raw['Payment Method'])
  const amount = parseAmount(raw.Amount)
  const notes = normalizeText(raw.Notes)
  const errors: string[] = []

  const project = projectName ? findProject(options, projectName) : null
  const categoryAccount =
    type && category ? findAccount(options, category, type === 'income' ? ['revenue'] : ['expense']) : null
  const paymentAccount = paymentMethod ? findAccount(options, paymentMethod, ['asset']) : null

  if (!projectName) errors.push('اسم المشروع مطلوب.')
  else if (!project) errors.push('المشروع غير موجود أو الاسم غير مطابق.')

  if (!date) errors.push('التاريخ غير صالح، استخدم YYYY-MM-DD.')
  if (!type) errors.push('النوع يجب أن يكون income/إيراد أو expense/مصروف.')
  if (!category) errors.push('البند مطلوب.')
  else if (type && !categoryAccount) errors.push('حساب البند غير موجود أو لا يناسب نوع القيد.')
  if (!description) errors.push('البيان مطلوب.')
  if (!paymentMethod) errors.push('طريقة الدفع مطلوبة لربط حساب الدفع.')
  else if (!paymentAccount) errors.push('حساب الدفع غير موجود؛ استخدم اسم الحساب أو كوده.')
  if (amount === null) errors.push('المبلغ يجب أن يكون رقمًا موجبًا أكبر من صفر.')

  return {
    excelRow,
    project: projectName,
    projectId: project?.id ?? null,
    date: date ?? normalizeText(raw.Date),
    type,
    category,
    categoryAccountId: categoryAccount?.id ?? null,
    description,
    contractor,
    paymentMethod,
    paymentAccountId: paymentAccount?.id ?? null,
    amount,
    notes,
    status: errors.length === 0 ? 'valid' : 'invalid',
    errors,
  }
}

function markDuplicates(rows: JournalImportRow[]): JournalImportRow[] {
  const seen = new Map<string, number>()

  return rows.map((row) => {
    if (row.status === 'invalid') return row

    const key = buildDuplicateKey(row)
    const firstRow = seen.get(key)
    if (firstRow) {
      return {
        ...row,
        status: 'invalid',
        errors: [...row.errors, `قيد مكرر داخل الملف مع الصف ${firstRow}.`],
      }
    }

    seen.set(key, row.excelRow)
    return row
  })
}

export async function parseJournalImportFile(file: File): Promise<JournalImportPreview> {
  if (!/\.(xlsx|xls)$/i.test(file.name)) throw new Error('اختر ملف Excel بصيغة XLSX أو XLS فقط.')
  if (file.size > journalImportLimits.maxFileSizeBytes) throw new Error('حجم الملف يتجاوز الحد الأقصى 5 MB.')

  const [buffer, options] = await Promise.all([file.arrayBuffer(), findJournalPostingOptions()])
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  const sheet = workbook.Sheets[SHEET_NAME]
  if (!sheet) throw new Error(`يجب أن يحتوي الملف على Sheet باسم ${SHEET_NAME}.`)

  validateHeaders(sheet)
  const rawRows = XLSX.utils.sheet_to_json<RawImportRow>(sheet, { defval: '', raw: true })
  const nonEmptyRows = rawRows.filter((row) => allHeaders.some((header) => normalizeText(row[header])))

  if (nonEmptyRows.length === 0) throw new Error('لا توجد صفوف بيانات داخل الملف.')
  if (nonEmptyRows.length > journalImportLimits.maxRows) {
    throw new Error(`عدد الصفوف يتجاوز الحد الأقصى ${journalImportLimits.maxRows} صف.`)
  }

  const rows = markDuplicates(nonEmptyRows.map((row, index) => mapRow(row, index + 2, options)))
  const validRows = rows.filter((row) => row.status === 'valid').length
  const invalidRows = rows.length - validRows

  return {
    fileName: file.name,
    rows,
    totalRows: rows.length,
    validRows,
    invalidRows,
    canImport: invalidRows === 0,
  }
}

export async function downloadJournalImportTemplate(): Promise<void> {
  const options = await findJournalPostingOptions()
  const workbook = XLSX.utils.book_new()
  const exampleProject = options.projects[0]?.name ?? 'اسم مشروع موجود بالنظام'
  const expenseAccount = options.accounts.find((account) => account.accountType === 'expense')
  const paymentAccount = options.accounts.find((account) => account.accountType === 'asset')

  const journalSheet = XLSX.utils.aoa_to_sheet([
    [...allHeaders],
    [
      exampleProject,
      new Date().toISOString().slice(0, 10),
      'مصروف',
      expenseAccount ? `${expenseAccount.code} — ${expenseAccount.name}` : 'اسم حساب مصروف',
      'مثال توضيحي — احذف هذا الصف قبل الاستيراد',
      '',
      paymentAccount ? `${paymentAccount.code} — ${paymentAccount.name}` : 'اسم حساب دفع',
      1000,
      '',
    ],
  ])

  journalSheet['!cols'] = [
    { wch: 24 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 38 },
    { wch: 22 },
    { wch: 30 },
    { wch: 14 },
    { wch: 30 },
  ]
  journalSheet['!autofilter'] = { ref: `A1:I${journalImportLimits.maxRows + 1}` }
  journalSheet['!freeze'] = { xSplit: 0, ySplit: 1 }

  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ['تعليمات استيراد القيود اليومية'],
    ['Project', 'استخدم اسم مشروع من Sheet المراجع.'],
    ['Date', 'التاريخ بصيغة YYYY-MM-DD.'],
    ['Type', 'يمكن استخدام income أو إيراد، وexpense أو مصروف.'],
    ['Category', 'استخدم اسم الحساب أو كوده أو القيمة الكاملة من Sheet المراجع.'],
    ['Payment Method', 'استخدم حساب دفع من نوع أصل كما يظهر في Sheet المراجع.'],
    ['Amount', 'رقم موجب أكبر من صفر، بدون رمز عملة.'],
    ['مهم', 'صف المثال للتوضيح فقط ويجب حذفه قبل رفع الملف.'],
  ])
  instructionsSheet['!cols'] = [{ wch: 22 }, { wch: 78 }]

  const projects = options.projects.map((project) => [project.name])
  const expenseAccounts = options.accounts
    .filter((account) => account.accountType === 'expense')
    .map((account) => [`${account.code} — ${account.name}`])
  const revenueAccounts = options.accounts
    .filter((account) => account.accountType === 'revenue')
    .map((account) => [`${account.code} — ${account.name}`])
  const paymentAccounts = options.accounts
    .filter((account) => account.accountType === 'asset')
    .map((account) => [`${account.code} — ${account.name}`])
  const maxReferenceRows = Math.max(
    projects.length,
    expenseAccounts.length,
    revenueAccounts.length,
    paymentAccounts.length,
  )
  const references = Array.from({ length: maxReferenceRows }, (_, index) => [
    projects[index]?.[0] ?? '',
    expenseAccounts[index]?.[0] ?? '',
    revenueAccounts[index]?.[0] ?? '',
    paymentAccounts[index]?.[0] ?? '',
  ])
  const referencesSheet = XLSX.utils.aoa_to_sheet([
    ['المشاريع', 'حسابات المصروفات', 'حسابات الإيرادات', 'حسابات الدفع'],
    ...references,
  ])
  referencesSheet['!cols'] = [{ wch: 28 }, { wch: 34 }, { wch: 34 }, { wch: 34 }]
  referencesSheet['!freeze'] = { xSplit: 0, ySplit: 1 }

  XLSX.utils.book_append_sheet(workbook, journalSheet, SHEET_NAME)
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')
  XLSX.utils.book_append_sheet(workbook, referencesSheet, 'References')
  XLSX.writeFile(workbook, TEMPLATE_FILE_NAME)
}
