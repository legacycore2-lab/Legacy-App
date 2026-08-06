/**
 * PDF Brand Configuration — single source of truth.
 * Change COMPANY_NAME here to update every generated report.
 */

export const COMPANY_NAME = 'LEGACY FINE TOUCH'
export const COMPANY_TAGLINE = 'إنشاء وتشطيبات'
export const COMPANY_WEBSITE = 'www.legacyfinetouch.com'
export const COMPANY_LOCATION = 'القاهرة — مصر'

/** Primary green palette */
export const BRAND = {
  dark: [18, 61, 43] as [number, number, number], // #123D2B  — header bg, hero KPI, table header
  mid: [27, 94, 64] as [number, number, number], // #1B5E40  — accent elements
  light: [39, 174, 96] as [number, number, number], // #27AE60  — bullet, active accent
  gold: [230, 160, 30] as [number, number, number], // #E6A01E  — highlighted KPI value
  blue: [30, 100, 200] as [number, number, number], // #1E64C8  — running balance
  white: [255, 255, 255] as [number, number, number],
  offWhite: [245, 248, 245] as [number, number, number],
  border: [210, 225, 215] as [number, number, number],
  textDark: [20, 40, 30] as [number, number, number],
  textMid: [80, 110, 95] as [number, number, number],
  textLight: [150, 170, 160] as [number, number, number],
  red: [192, 57, 43] as [number, number, number],
  footerText: [180, 210, 195] as [number, number, number],
  /** Payment method badge colours */
  badge: {
    cash: { bg: [220, 245, 230] as [number, number, number], fg: [39, 174, 96] as [number, number, number] },
    cheque: {
      bg: [255, 240, 210] as [number, number, number],
      fg: [200, 130, 30] as [number, number, number],
    },
    bank: { bg: [220, 235, 255] as [number, number, number], fg: [30, 100, 200] as [number, number, number] },
  },
} as const
