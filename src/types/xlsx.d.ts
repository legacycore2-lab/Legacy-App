/**
 * Type stub for xlsx (SheetJS).
 * The actual package is loaded at runtime from cdn.sheetjs.com.
 * This stub prevents TypeScript errors in environments where the
 * package is not installed (e.g., local dev containers).
 */
declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[]
    Sheets: Record<string, WorkSheet>
  }

  export interface WorkSheet {
    [key: string]: CellObject | unknown
  }

  export interface CellObject {
    v?: string | number | boolean | Date
    t?: string
    f?: string
    r?: string
    h?: string
    c?: unknown
    z?: string
    l?: unknown
    s?: unknown
  }

  export interface Utils {
    sheet_to_json<T = unknown>(
      worksheet: WorkSheet,
      opts?: { defval?: unknown; header?: unknown; range?: unknown },
    ): T[]
  }

  export function read(data: ArrayBuffer | string, opts?: { type?: string; cellDates?: boolean }): WorkBook

  export const utils: Utils
}
