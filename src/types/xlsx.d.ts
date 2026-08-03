// Legacy Core ERP
// Minimal declarations for the lazily loaded xlsx package APIs used by the app.

declare module 'xlsx' {
  export interface WorkSheet {
    [key: string]: unknown
    '!cols'?: Array<{ wch?: number }>
    '!autofilter'?: { ref: string }
    '!freeze'?: { xSplit: number; ySplit: number }
    '!ref'?: string
  }

  export interface WorkBook {
    SheetNames: string[]
    Sheets: Record<string, WorkSheet>
  }

  export const read: (data: unknown, opts?: { type?: string; cellDates?: boolean }) => WorkBook
  export const writeFile: (wb: WorkBook, filename: string) => void
  export const write: (wb: WorkBook, opts: { type: string; bookType: string }) => ArrayBuffer

  export const utils: {
    sheet_to_json: <T = Record<string, unknown>>(
      sheet: WorkSheet,
      opts?: { header?: number | string[]; defval?: unknown; blankrows?: boolean; raw?: boolean },
    ) => T[]
    book_new: () => WorkBook
    book_append_sheet: (wb: WorkBook, sheet: WorkSheet, name: string) => void
    json_to_sheet: (data: unknown[]) => WorkSheet
    aoa_to_sheet: (data: unknown[][]) => WorkSheet
  }

  export const SSF: {
    parse_date_code: (v: number) => { y: number; m: number; d: number } | null
  }
}
