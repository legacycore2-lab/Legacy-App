import { describe, expect, it } from 'vitest'
import { defaultSettings, validateSettings } from './settings.service'
describe('settings service', () => {
  it('accepts valid Egyptian defaults with company name', () => {
    expect(validateSettings({ ...defaultSettings, companyLegalName: 'شركة اختبار' })).toEqual([])
  })
  it('requires a legal company name', () => {
    expect(validateSettings(defaultSettings)[0]).toContain('القانوني')
  })
  it('validates email, VAT and session timeout', () => {
    const errors = validateSettings({
      ...defaultSettings,
      companyLegalName: 'شركة',
      email: 'bad',
      vatRate: 120,
      sessionTimeoutMinutes: 2,
    })
    expect(errors).toHaveLength(3)
  })
})
