export type ProjectFormValues = {
  name: string
  clientName: string
  startDate: string
  closeDate: string
  progress: number
}

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValues, string>>
