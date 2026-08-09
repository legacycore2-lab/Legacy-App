import type { ManagedUser } from '../types/users.types'

const previewUsers: ManagedUser[] = [
  {
    id: 'preview-super-admin',
    displayName: 'أحمد المدير',
    email: 'ahmed@company.com',
    role: 'super_admin',
    status: 'active',
    lastLoginAt: 'اليوم 09:15 ص',
    createdAt: '2026-01-15',
    projectCount: 0,
    phone: '+20 100 123 4567',
  },
  {
    id: 'preview-admin',
    displayName: 'محمود الإداري',
    email: 'mahmoud@company.com',
    role: 'admin',
    status: 'active',
    lastLoginAt: 'أمس 04:30 م',
    createdAt: '2026-02-20',
    projectCount: 5,
  },
  {
    id: 'preview-accountant',
    displayName: 'سارة المحاسبة',
    email: 'sara@company.com',
    role: 'accountant',
    status: 'active',
    lastLoginAt: 'اليوم 08:45 ص',
    createdAt: '2026-03-10',
    projectCount: 3,
  },
  {
    id: 'preview-viewer',
    displayName: 'علي المشاهد',
    email: 'ali@company.com',
    role: 'viewer',
    status: 'active',
    lastLoginAt: 'أمس 11:20 ص',
    createdAt: '2026-03-18',
    projectCount: 1,
  },
  {
    id: 'preview-suspended',
    displayName: 'محمد الموقوف',
    email: 'mohamed@company.com',
    role: 'accountant',
    status: 'suspended',
    lastLoginAt: '2026-06-01',
    createdAt: '2026-01-05',
    projectCount: 1,
  },
]

export async function findUsers(): Promise<ManagedUser[]> {
  // UI foundation only. Replace with the approved Supabase-backed repository in the data integration PR.
  return previewUsers
}
