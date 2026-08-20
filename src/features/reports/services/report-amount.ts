export function parseSignedReportAmount(raw: number | string | null | undefined): number {
  const amount = Number(raw)
  return Number.isFinite(amount) ? amount : 0
}
