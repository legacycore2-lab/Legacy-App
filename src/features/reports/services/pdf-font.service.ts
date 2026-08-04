import type jsPDF from 'jspdf'

export const ARABIC_FONT_NAME = 'Amiri'
export const ARABIC_FONT_STYLE = 'normal' as const

// Font is served from /public/fonts — not bundled, fetched lazily on first PDF export.
const FONT_URL = `${import.meta.env.BASE_URL}fonts/Amiri-Regular-Arabic.ttf`

let cachedBase64: string | null = null

/**
 * Fetches the Arabic font TTF file and converts it to a base64 string.
 * Result is cached in memory so subsequent PDF exports skip the network round-trip.
 */
async function fetchFontBase64(): Promise<string> {
  if (cachedBase64) return cachedBase64

  const response = await fetch(FONT_URL)
  if (!response.ok) {
    throw new Error(`Failed to load Arabic font from ${FONT_URL}: ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  cachedBase64 = btoa(binary)
  return cachedBase64
}

/**
 * Registers the Arabic font with a jsPDF instance.
 * Fetches the font file lazily on first call, then uses the cached version.
 *
 * Must be called before any text rendering to avoid mojibake / empty boxes.
 */
export async function registerArabicFont(doc: jsPDF): Promise<void> {
  const base64 = await fetchFontBase64()

  doc.addFileToVFS('Amiri-Regular.ttf', base64)
  // Register both normal and bold weights so autoTable's header bold style
  // falls back gracefully without console warnings.
  doc.addFont('Amiri-Regular.ttf', ARABIC_FONT_NAME, 'normal')
  doc.addFont('Amiri-Regular.ttf', ARABIC_FONT_NAME, 'bold')

  doc.setFont(ARABIC_FONT_NAME, ARABIC_FONT_STYLE)
}
