import { findDashboardData } from '../repositories/dashboard.repository'
import type { DashboardData } from '../types/dashboard.types'

export function getDashboardData(): Promise<DashboardData> { return findDashboardData() }
