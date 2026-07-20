export type ProjectFormValues = {
  name: string
  clientName: string
  startDate: string
  closeDate: string
  progress: number
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>

export function validateProjectForm(values: ProjectFormValues): ProjectFormErrors {
  const errors: ProjectFormErrors = {}

  if (!values.name.trim()) errors.name = 'اسم المشروع مطلوب.'
  if (values.progress < 0 || values.progress > 100) errors.progress = 'نسبة التنفيذ يجب أن تكون بين 0 و100.'
  if (values.closeDate && values.startDate && values.closeDate < values.startDate) {
    errors.closeDate = 'تاريخ الانتهاء لا يمكن أن يسبق تاريخ البداية.'
  }

  return errors
}

export function hasProjectFormErrors(errors: ProjectFormErrors): boolean {
  return Object.keys(errors).length > 0
}
