/**
 * PDF Brand Configuration — single source of truth for every exported report.
 * Premium Legacy Core identity: deep navy + restrained gold + warm paper.
 */

export const COMPANY_NAME = 'LEGACY CORE'
export const COMPANY_TAGLINE = 'FINANCIAL MANAGEMENT SYSTEM'
export const COMPANY_WEBSITE = 'www.legacycore.com'
export const COMPANY_LOCATION = 'القاهرة — مصر'

export const BRAND = {
  dark: [4, 28, 50] as [number, number, number], // #041C32 — masthead, hero totals, table headers
  mid: [12, 48, 76] as [number, number, number], // #0C304C — secondary navy
  light: [184, 132, 53] as [number, number, number], // #B88435 — premium gold accent
  gold: [197, 145, 58] as [number, number, number], // #C5913A — highlighted totals
  blue: [29, 78, 121] as [number, number, number], // #1D4E79 — running balances
  white: [255, 255, 255] as [number, number, number],
  offWhite: [250, 248, 243] as [number, number, number], // warm report paper
  border: [222, 215, 202] as [number, number, number],
  textDark: [15, 30, 43] as [number, number, number],
  textMid: [91, 94, 96] as [number, number, number],
  textLight: [148, 145, 137] as [number, number, number],
  red: [190, 49, 49] as [number, number, number],
  footerText: [210, 218, 224] as [number, number, number],
  badge: {
    cash: {
      bg: [242, 237, 225] as [number, number, number],
      fg: [130, 91, 34] as [number, number, number],
    },
    cheque: {
      bg: [250, 238, 218] as [number, number, number],
      fg: [166, 109, 28] as [number, number, number],
    },
    bank: {
      bg: [226, 235, 243] as [number, number, number],
      fg: [29, 78, 121] as [number, number, number],
    },
  },
} as const
