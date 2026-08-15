import type jsPDF from 'jspdf'

export const ARABIC_FONT_NAME = 'Amiri'
export const ARABIC_FONT_STYLE = 'normal' as const

const FONT_FILE = 'fonts/Amiri-Regular-Arabic.ttf'

let cachedBase64: string | null = null

function getFontUrls(): string[] {
  const baseUrl = import.meta.env.BASE_URL || '/'
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const candidates = [
    `${normalizedBase}${FONT_FILE}`,
    new URL(`${normalizedBase}${FONT_FILE}`, window.location.origin).toString(),
    new URL(FONT_FILE, document.baseURI).toString(),
  ]

  return [...new Set(candidates)]
}

async function fetchFontBase64(): Promise<string> {
  if (cachedBase64) return cachedBase64

  let lastStatus: number | null = null

  for (const url of getFontUrls()) {
    try {
      const response = await fetch(url, { cache: 'force-cache' })
      lastStatus = response.status
      if (!response.ok) continue

      const buffer = await response.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      const chunkSize = 0x8000
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
      }
      cachedBase64 = btoa(binary)
      return cachedBase64
    } catch {
      // Try the next URL candidate. GitHub Pages can serve the app from a nested base path.
    }
  }

  throw new Error(
    `تعذر تحميل خط التقارير العربية${lastStatus ? ` (HTTP ${lastStatus})` : ''}. حدّث الصفحة وحاول مرة أخرى.`,
  )
}

export async function registerArabicFont(doc: jsPDF): Promise<void> {
  const base64 = await fetchFontBase64()

  doc.addFileToVFS('Amiri-Regular.ttf', base64)
  doc.addFont('Amiri-Regular.ttf', ARABIC_FONT_NAME, 'normal')
  doc.addFont('Amiri-Regular.ttf', ARABIC_FONT_NAME, 'bold')
  doc.setFont(ARABIC_FONT_NAME, ARABIC_FONT_STYLE)
}
