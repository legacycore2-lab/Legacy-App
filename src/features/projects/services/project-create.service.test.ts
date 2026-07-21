import { describe, expect, it } from 'vitest'
import { buildProjectCreatePreview, validateProjectCreateInput } from './project-create.service'
import type { ProjectCreateInput } from '../types/project-create.types'

const validInput: ProjectCreateInput = {
  name: 'مشروع تجريبي',
  code: 'PRJ-001',
  client: 'عميل تجريبي',
  location: 'القاهرة',
  manager: 'مدير المشروع',
  status: 'active',
  contractValue: '1250000',
  startDate: '2026-07-21',
  endDate: '2026-12-31',
  notes: 'ملاحظات',
}

describe('project creation service', () => {
  it('builds a normalized preview for valid input', () => {
    expect(buildProjectCreatePreview(validInput)).toEqual({
      ...validInput,
      contractValue: 1_250_000,
    })
  })

  it('rejects an end date before the start date', () => {
    const errors = validateProjectCreateInput({
      ...validInput,
      endDate: '2026-07-20',
    })

    expect(errors).toContain('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.')
  })

  it('rejects negative contract values', () => {
    const errors = validateProjectCreateInput({
      ...validInput,
      contractValue: '-1',
    })

    expect(errors).toContain('قيمة التعاقد غير صحيحة.')
  })
})
